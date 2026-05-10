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
import com.kyrylo.thesis.course.domain.Enrollment;
import com.kyrylo.thesis.course.domain.EnrollmentStatus;
import com.kyrylo.thesis.course.domain.Lesson;
import com.kyrylo.thesis.course.domain.Quiz;
import com.kyrylo.thesis.course.domain.QuizAttempt;
import com.kyrylo.thesis.course.domain.TaskSubmissionStatus;
import com.kyrylo.thesis.course.integration.UserDirectoryClient;
import com.kyrylo.thesis.course.integration.userservice.MeContextDto;
import com.kyrylo.thesis.course.integration.userservice.OrganizationContextDto;
import com.kyrylo.thesis.course.integration.userservice.OrganizationMemberKind;
import com.kyrylo.thesis.course.integration.userservice.UserRole;
import com.kyrylo.thesis.course.repository.CourseRepository;
import com.kyrylo.thesis.course.repository.EnrollmentRepository;
import com.kyrylo.thesis.course.repository.QuizAttemptRepository;
import com.kyrylo.thesis.course.repository.TaskSubmissionRepository;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class EnrollmentApplicationServiceTest {

    @Mock CourseRepository courseRepository;
    @Mock EnrollmentRepository enrollmentRepository;
    @Mock UserDirectoryClient userDirectoryClient;
    @Mock QuizAttemptRepository quizAttemptRepository;
    @Mock TaskSubmissionRepository taskSubmissionRepository;
    @Mock SkillApplicationService skillApplicationService;

    @InjectMocks
    EnrollmentApplicationService service;

    // ── helpers ──────────────────────────────────────────────────────────────

    private static MeContextDto learnerCtx(Long userId, Long orgId) {
        MeContextDto ctx = new MeContextDto();
        ctx.setRole(UserRole.LEARNER);
        ctx.setUserId(userId);
        OrganizationContextDto o = new OrganizationContextDto();
        o.setOrganizationId(orgId);
        o.setMemberKind(OrganizationMemberKind.LEARNER);
        ctx.setOrganizations(List.of(o));
        return ctx;
    }

    private static MeContextDto educatorCtx(Long userId, Long orgId) {
        MeContextDto ctx = new MeContextDto();
        ctx.setRole(UserRole.EDUCATOR);
        ctx.setUserId(userId);
        OrganizationContextDto o = new OrganizationContextDto();
        o.setOrganizationId(orgId);
        o.setMemberKind(OrganizationMemberKind.EDUCATOR);
        ctx.setOrganizations(List.of(o));
        return ctx;
    }

    private static Course publishedCourse(Long id, Long orgId) {
        return Course.builder().id(id).organizationId(orgId).title("T").status(CourseStatus.PUBLISHED).build();
    }

    // ── enrollSelf ────────────────────────────────────────────────────────────

    @Test
    void enrollSelf_success() {
        Course course = publishedCourse(1L, 10L);
        MeContextDto ctx = learnerCtx(5L, 10L);

        when(userDirectoryClient.fetchMeContext(any())).thenReturn(ctx);
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(enrollmentRepository.existsByUserIdAndCourseId(5L, 1L)).thenReturn(false);

        Enrollment saved = Enrollment.builder().id(99L).userId(5L).course(course).status(EnrollmentStatus.ENROLLED).progressPercentage(0).build();
        when(enrollmentRepository.save(any())).thenReturn(saved);

        var resp = service.enrollSelf("auth", 1L);
        assertEquals(99L, resp.getId());
        assertEquals(5L, resp.getUserId());
    }

    @Test
    void enrollSelf_notLearner_throws() {
        MeContextDto ctx = new MeContextDto();
        ctx.setRole(UserRole.EDUCATOR);
        when(userDirectoryClient.fetchMeContext(any())).thenReturn(ctx);

        assertThrows(ResponseStatusException.class, () -> service.enrollSelf("auth", 1L));
    }

    @Test
    void enrollSelf_notInOrg_throws() {
        Course course = publishedCourse(1L, 10L);
        MeContextDto ctx = learnerCtx(5L, 99L); // інша організація

        when(userDirectoryClient.fetchMeContext(any())).thenReturn(ctx);
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));

        assertThrows(ResponseStatusException.class, () -> service.enrollSelf("auth", 1L));
    }

    @Test
    void enrollSelf_courseNotFound_throws() {
        MeContextDto ctx = learnerCtx(5L, 10L);
        when(userDirectoryClient.fetchMeContext(any())).thenReturn(ctx);
        when(courseRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> service.enrollSelf("auth", 1L));
    }

    // ── enroll (internal) ─────────────────────────────────────────────────────

    @Test
    void enroll_duplicateThrows409() {
        Course course = publishedCourse(1L, 10L);
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(enrollmentRepository.existsByUserIdAndCourseId(5L, 1L)).thenReturn(true);

        assertThrows(ResponseStatusException.class, () -> service.enroll(5L, 1L));
    }

    @Test
    void enroll_draftCourseThrows() {
        Course draft = Course.builder().id(1L).organizationId(10L).title("T").status(CourseStatus.DRAFT).build();
        when(courseRepository.findById(1L)).thenReturn(Optional.of(draft));

        assertThrows(ResponseStatusException.class, () -> service.enroll(5L, 1L));
    }

    // ── getMyEnrollments ──────────────────────────────────────────────────────

    @Test
    void getMyEnrollments_returnsMappedList() {
        Course course = publishedCourse(1L, 10L);
        Enrollment e = Enrollment.builder().id(7L).userId(5L).course(course).status(EnrollmentStatus.ENROLLED).progressPercentage(0).build();
        when(enrollmentRepository.findByUserId(5L)).thenReturn(List.of(e));

        var list = service.getMyEnrollments(5L);
        assertEquals(1, list.size());
        assertEquals(7L, list.get(0).getId());
        assertEquals(1L, list.get(0).getCourseId());
    }

    // ── unenrollLearner ───────────────────────────────────────────────────────

    @Test
    void unenrollLearner_success_byEducator() {
        Course course = publishedCourse(1L, 10L);
        MeContextDto ctx = educatorCtx(2L, 10L);
        Enrollment e = Enrollment.builder().id(7L).userId(5L).course(course).build();

        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(userDirectoryClient.fetchMeContext(any())).thenReturn(ctx);
        when(enrollmentRepository.findByUserIdAndCourseId(5L, 1L)).thenReturn(Optional.of(e));

        assertDoesNotThrow(() -> service.unenrollLearner("auth", 1L, 5L));
        verify(enrollmentRepository).delete(e);
    }

    @Test
    void unenrollLearner_forbidden_forLearner() {
        Course course = publishedCourse(1L, 10L);
        MeContextDto ctx = learnerCtx(5L, 10L);

        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(userDirectoryClient.fetchMeContext(any())).thenReturn(ctx);

        assertThrows(ResponseStatusException.class, () -> service.unenrollLearner("auth", 1L, 5L));
    }

    // ── recalculateProgress ───────────────────────────────────────────────────

    @Test
    void recalculateProgress_noAssessments_doesNothing() {
        Course course = Course.builder().id(1L).organizationId(10L).title("T").status(CourseStatus.PUBLISHED).build();
        CourseModule module = CourseModule.builder().id(1L).name("M").sortOrder(1).build();
        Lesson lesson = Lesson.builder().id(1L).title("L").content("c").build();
        module.addLesson(lesson);
        course.addModule(module);

        // Урок без квізу і без завдання — totalAssessments = 0, метод повертається одразу
        service.recalculateProgress(5L, course);

        verify(enrollmentRepository, never()).save(any());
    }

    @Test
    void recalculateProgress_allPassed_setsCompleted() {
        Course course = Course.builder().id(1L).organizationId(10L).title("T").status(CourseStatus.PUBLISHED).build();
        CourseModule module = CourseModule.builder().id(1L).name("M").sortOrder(1).build();
        Quiz quiz = Quiz.builder().id(10L).title("Q").passingScore(60).build();
        Lesson lesson = Lesson.builder().id(1L).title("L").content("c").quiz(quiz).build();
        quiz.setLesson(lesson);
        module.addLesson(lesson);
        course.addModule(module);

        QuizAttempt passed = QuizAttempt.builder().id(1L).userId(5L).quiz(quiz).passed(true).scorePercentage(80).correctCount(4).totalCount(5).build();
        when(quizAttemptRepository.findTopByUserIdAndQuizIdOrderByAttemptedAtDesc(5L, 10L))
                .thenReturn(Optional.of(passed));

        Enrollment enrollment = Enrollment.builder().id(7L).userId(5L).course(course).status(EnrollmentStatus.ENROLLED).progressPercentage(0).build();
        when(enrollmentRepository.findByUserIdAndCourseId(5L, 1L)).thenReturn(Optional.of(enrollment));

        service.recalculateProgress(5L, course);

        verify(enrollmentRepository).save(argThat(e -> e.getStatus() == EnrollmentStatus.COMPLETED && e.getProgressPercentage() == 100));
        verify(skillApplicationService).awardSkillsForCompletedCourse(5L, 1L);
    }

    @Test
    void recalculateProgress_partialProgress_notCompleted() {
        Course course = Course.builder().id(1L).organizationId(10L).title("T").status(CourseStatus.PUBLISHED).build();
        CourseModule module = CourseModule.builder().id(1L).name("M").sortOrder(1).build();

        Quiz quiz1 = Quiz.builder().id(10L).title("Q1").passingScore(60).build();
        Lesson lesson1 = Lesson.builder().id(1L).title("L1").content("c").quiz(quiz1).build();
        quiz1.setLesson(lesson1);

        Quiz quiz2 = Quiz.builder().id(11L).title("Q2").passingScore(60).build();
        Lesson lesson2 = Lesson.builder().id(2L).title("L2").content("c").quiz(quiz2).build();
        quiz2.setLesson(lesson2);

        module.addLesson(lesson1);
        module.addLesson(lesson2);
        course.addModule(module);

        QuizAttempt passed = QuizAttempt.builder().id(1L).userId(5L).quiz(quiz1).passed(true).scorePercentage(80).correctCount(4).totalCount(5).build();
        when(quizAttemptRepository.findTopByUserIdAndQuizIdOrderByAttemptedAtDesc(5L, 10L))
                .thenReturn(Optional.of(passed));
        when(quizAttemptRepository.findTopByUserIdAndQuizIdOrderByAttemptedAtDesc(5L, 11L))
                .thenReturn(Optional.empty());

        Enrollment enrollment = Enrollment.builder().id(7L).userId(5L).course(course).status(EnrollmentStatus.ENROLLED).progressPercentage(0).build();
        when(enrollmentRepository.findByUserIdAndCourseId(5L, 1L)).thenReturn(Optional.of(enrollment));

        service.recalculateProgress(5L, course);

        verify(enrollmentRepository).save(argThat(e -> e.getStatus() == EnrollmentStatus.ENROLLED && e.getProgressPercentage() == 50));
        verify(skillApplicationService, never()).awardSkillsForCompletedCourse(any(), any());
    }

    // ── getCourseProgress ─────────────────────────────────────────────────────

    @Test
    void getCourseProgress_notEnrolled_throws() {
        Course course = publishedCourse(1L, 10L);
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(enrollmentRepository.findByUserIdAndCourseId(5L, 1L)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> service.getCourseProgress(5L, 1L));
    }

    @Test
    void getCourseProgress_returnsCorrectStructure() {
        Course course = Course.builder().id(1L).organizationId(10L).title("T").status(CourseStatus.PUBLISHED).build();
        CourseModule module = CourseModule.builder().id(1L).name("M").sortOrder(1).build();
        Lesson lesson = Lesson.builder().id(1L).title("L").content("c").build();
        module.addLesson(lesson);
        course.addModule(module);

        Enrollment enrollment = Enrollment.builder().id(7L).userId(5L).course(course).status(EnrollmentStatus.ENROLLED).progressPercentage(42).build();
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(enrollmentRepository.findByUserIdAndCourseId(5L, 1L)).thenReturn(Optional.of(enrollment));

        var progress = service.getCourseProgress(5L, 1L);
        assertEquals(42, progress.getProgressPercentage());
        assertEquals(EnrollmentStatus.ENROLLED, progress.getEnrollmentStatus());
        assertEquals(1, progress.getLessonProgresses().size());
        assertEquals(1L, progress.getLessonProgresses().get(0).getLessonId());
    }
}
