package com.kyrylo.thesis.course.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.kyrylo.thesis.course.domain.Course;
import com.kyrylo.thesis.course.domain.CourseModule;
import com.kyrylo.thesis.course.domain.CourseStatus;
import com.kyrylo.thesis.course.domain.Lesson;
import com.kyrylo.thesis.course.domain.PracticalTask;
import com.kyrylo.thesis.course.domain.TaskSubmission;
import com.kyrylo.thesis.course.domain.TaskSubmissionStatus;
import com.kyrylo.thesis.course.integration.UserDirectoryClient;
import com.kyrylo.thesis.course.integration.userservice.MeContextDto;
import com.kyrylo.thesis.course.integration.userservice.OrganizationContextDto;
import com.kyrylo.thesis.course.integration.userservice.OrganizationMemberKind;
import com.kyrylo.thesis.course.integration.userservice.UserRole;
import com.kyrylo.thesis.course.repository.PracticalTaskRepository;
import com.kyrylo.thesis.course.repository.TaskSubmissionRepository;
import com.kyrylo.thesis.course.web.dto.ReviewTaskSubmissionRequest;
import com.kyrylo.thesis.course.web.dto.SubmitTaskRequest;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class PracticalTaskApplicationServiceTest {

    @Mock PracticalTaskRepository practicalTaskRepository;
    @Mock TaskSubmissionRepository taskSubmissionRepository;
    @Mock CourseApplicationService courseApplicationService;
    @Mock EnrollmentApplicationService enrollmentApplicationService;
    @Mock UserDirectoryClient userDirectoryClient;

    @InjectMocks
    PracticalTaskApplicationService service;

    // ── helpers ───────────────────────────────────────────────────────────────

    private PracticalTask buildTask(Long taskId, Long orgId) {
        Course course = Course.builder().id(1L).organizationId(orgId).title("C").status(CourseStatus.PUBLISHED).build();
        CourseModule module = CourseModule.builder().id(1L).name("M").sortOrder(1).course(course).build();
        Lesson lesson = Lesson.builder().id(1L).title("L").content("c").module(module).build();
        PracticalTask task = PracticalTask.builder().id(taskId).title("Task").description("Desc").lesson(lesson).build();
        lesson.setPracticalTask(task);
        return task;
    }

    private MeContextDto educatorCtx(Long userId, Long orgId) {
        MeContextDto ctx = new MeContextDto();
        ctx.setRole(UserRole.EDUCATOR);
        ctx.setUserId(userId);
        OrganizationContextDto o = new OrganizationContextDto();
        o.setOrganizationId(orgId);
        o.setMemberKind(OrganizationMemberKind.EDUCATOR);
        ctx.setOrganizations(List.of(o));
        return ctx;
    }

    // ── submitTask ────────────────────────────────────────────────────────────

    @Test
    void submitTask_success() {
        PracticalTask task = buildTask(1L, 10L);
        when(practicalTaskRepository.findById(1L)).thenReturn(Optional.of(task));
        doNothing().when(courseApplicationService).authorizeViewCourse(any(), any());

        TaskSubmission saved = TaskSubmission.builder()
                .id(99L).userId(5L).practicalTask(task)
                .repositoryUrl("https://github.com/test/repo")
                .status(TaskSubmissionStatus.PENDING).build();
        when(taskSubmissionRepository.save(any())).thenReturn(saved);

        SubmitTaskRequest req = new SubmitTaskRequest();
        req.setRepositoryUrl("https://github.com/test/repo");

        var resp = service.submitTask("auth", 5L, 1L, req);
        assertEquals(99L, resp.getId());
        assertEquals(TaskSubmissionStatus.PENDING, resp.getStatus());
        assertEquals("https://github.com/test/repo", resp.getRepositoryUrl());
    }

    @Test
    void submitTask_taskNotFound_throws() {
        when(practicalTaskRepository.findById(99L)).thenReturn(Optional.empty());

        SubmitTaskRequest req = new SubmitTaskRequest();
        req.setRepositoryUrl("https://github.com/test/repo");

        assertThrows(ResponseStatusException.class, () -> service.submitTask("auth", 5L, 99L, req));
    }

    // ── reviewSubmission ──────────────────────────────────────────────────────

    @Test
    void reviewSubmission_approved_triggersProgressRecalculation() {
        PracticalTask task = buildTask(1L, 10L);
        TaskSubmission submission = TaskSubmission.builder()
                .id(1L).userId(5L).practicalTask(task)
                .status(TaskSubmissionStatus.PENDING).build();

        MeContextDto ctx = educatorCtx(2L, 10L);
        when(userDirectoryClient.fetchMeContext(any())).thenReturn(ctx);
        when(taskSubmissionRepository.findById(1L)).thenReturn(Optional.of(submission));
        when(taskSubmissionRepository.save(any())).thenReturn(submission);

        ReviewTaskSubmissionRequest req = new ReviewTaskSubmissionRequest();
        req.setStatus(TaskSubmissionStatus.APPROVED);
        req.setReviewerComment("Good job!");

        var resp = service.reviewSubmission("auth", 1L, 2L, req);
        assertEquals(TaskSubmissionStatus.APPROVED, resp.getStatus());
        verify(enrollmentApplicationService).recalculateProgress(eq(5L), any());
    }

    @Test
    void reviewSubmission_needsWork_doesNotTriggerProgress() {
        PracticalTask task = buildTask(1L, 10L);
        TaskSubmission submission = TaskSubmission.builder()
                .id(1L).userId(5L).practicalTask(task)
                .status(TaskSubmissionStatus.PENDING).build();

        MeContextDto ctx = educatorCtx(2L, 10L);
        when(userDirectoryClient.fetchMeContext(any())).thenReturn(ctx);
        when(taskSubmissionRepository.findById(1L)).thenReturn(Optional.of(submission));
        when(taskSubmissionRepository.save(any())).thenReturn(submission);

        ReviewTaskSubmissionRequest req = new ReviewTaskSubmissionRequest();
        req.setStatus(TaskSubmissionStatus.NEEDS_WORK);
        req.setReviewerComment("Fix it");

        service.reviewSubmission("auth", 1L, 2L, req);
        verify(enrollmentApplicationService, never()).recalculateProgress(any(), any());
    }

    @Test
    void reviewSubmission_forbidden_wrongOrg() {
        PracticalTask task = buildTask(1L, 10L);
        TaskSubmission submission = TaskSubmission.builder()
                .id(1L).userId(5L).practicalTask(task)
                .status(TaskSubmissionStatus.PENDING).build();

        MeContextDto ctx = educatorCtx(2L, 99L); // інша організація
        when(userDirectoryClient.fetchMeContext(any())).thenReturn(ctx);
        when(taskSubmissionRepository.findById(1L)).thenReturn(Optional.of(submission));

        ReviewTaskSubmissionRequest req = new ReviewTaskSubmissionRequest();
        req.setStatus(TaskSubmissionStatus.APPROVED);

        assertThrows(ResponseStatusException.class, () -> service.reviewSubmission("auth", 1L, 2L, req));
    }

    @Test
    void reviewSubmission_reviewerIdMismatch_throws() {
        PracticalTask task = buildTask(1L, 10L);
        TaskSubmission submission = TaskSubmission.builder()
                .id(1L).userId(5L).practicalTask(task)
                .status(TaskSubmissionStatus.PENDING).build();

        MeContextDto ctx = educatorCtx(2L, 10L);
        when(userDirectoryClient.fetchMeContext(any())).thenReturn(ctx);
        when(taskSubmissionRepository.findById(1L)).thenReturn(Optional.of(submission));

        ReviewTaskSubmissionRequest req = new ReviewTaskSubmissionRequest();
        req.setStatus(TaskSubmissionStatus.APPROVED);

        // reviewerId=99 не збігається з ctx.userId=2
        assertThrows(ResponseStatusException.class, () -> service.reviewSubmission("auth", 1L, 99L, req));
    }

    @Test
    void reviewSubmission_notFound_throws() {
        MeContextDto ctx = educatorCtx(2L, 10L);
        when(userDirectoryClient.fetchMeContext(any())).thenReturn(ctx);
        when(taskSubmissionRepository.findById(99L)).thenReturn(Optional.empty());

        ReviewTaskSubmissionRequest req = new ReviewTaskSubmissionRequest();
        req.setStatus(TaskSubmissionStatus.APPROVED);

        assertThrows(ResponseStatusException.class, () -> service.reviewSubmission("auth", 99L, 2L, req));
    }

    // ── getMySubmission ───────────────────────────────────────────────────────

    @Test
    void getMySubmission_returnsLatest() {
        PracticalTask task = buildTask(1L, 10L);
        TaskSubmission submission = TaskSubmission.builder()
                .id(1L).userId(5L).practicalTask(task)
                .status(TaskSubmissionStatus.PENDING).build();

        when(taskSubmissionRepository.findTopByUserIdAndPracticalTaskIdOrderBySubmittedAtDesc(5L, 1L))
                .thenReturn(Optional.of(submission));

        var resp = service.getMySubmission(5L, 1L);
        assertNotNull(resp);
        assertEquals(1L, resp.getId());
    }

    @Test
    void getMySubmission_noSubmission_returnsNull() {
        when(taskSubmissionRepository.findTopByUserIdAndPracticalTaskIdOrderBySubmittedAtDesc(5L, 1L))
                .thenReturn(Optional.empty());

        assertNull(service.getMySubmission(5L, 1L));
    }

    // ── getPendingSubmissions ─────────────────────────────────────────────────

    @Test
    void getPendingSubmissions_superCurator_returnsAll() {
        MeContextDto ctx = new MeContextDto();
        ctx.setSuperAdmin(true);
        when(userDirectoryClient.fetchMeContext(any())).thenReturn(ctx);
        when(taskSubmissionRepository.findAllByStatusWithTask(TaskSubmissionStatus.PENDING))
                .thenReturn(List.of());

        var result = service.getPendingSubmissions("auth");
        assertTrue(result.isEmpty());
    }
}
