package com.kyrylo.thesis.course.service;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kyrylo.thesis.course.domain.Course;
import com.kyrylo.thesis.course.domain.PracticalTask;
import com.kyrylo.thesis.course.domain.TaskSubmission;
import com.kyrylo.thesis.course.domain.TaskSubmissionStatus;
import com.kyrylo.thesis.course.integration.UserDirectoryClient;
import com.kyrylo.thesis.course.integration.userservice.MeContextDto;
import com.kyrylo.thesis.course.integration.userservice.UserRole;
import com.kyrylo.thesis.course.repository.PracticalTaskRepository;
import com.kyrylo.thesis.course.repository.TaskSubmissionRepository;
import com.kyrylo.thesis.course.web.dto.PendingTaskSubmissionResponse;
import com.kyrylo.thesis.course.web.dto.ReviewTaskSubmissionRequest;
import com.kyrylo.thesis.course.web.dto.SubmitTaskRequest;
import com.kyrylo.thesis.course.web.dto.TaskSubmissionResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class PracticalTaskApplicationService {

    private final PracticalTaskRepository practicalTaskRepository;
    private final TaskSubmissionRepository taskSubmissionRepository;
    private final CourseApplicationService courseApplicationService;
    private final EnrollmentApplicationService enrollmentApplicationService;
    private final UserDirectoryClient userDirectoryClient;

    @Transactional
    public TaskSubmissionResponse submitTask(String authorizationHeader, Long userId, Long taskId, SubmitTaskRequest request) {
        PracticalTask task = practicalTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Завдання не знайдено"));

        courseApplicationService.authorizeViewCourse(authorizationHeader, task.getLesson().getModule().getCourse());

        TaskSubmission submission = TaskSubmission.builder()
                .userId(userId)
                .practicalTask(task)
                .repositoryUrl(request.getRepositoryUrl())
                .status(TaskSubmissionStatus.PENDING)
                .submittedAt(Instant.now())
                .build();

        submission = taskSubmissionRepository.save(submission);
        
        return toResponse(submission);
    }

    @Transactional(readOnly = true)
    public List<PendingTaskSubmissionResponse> getPendingSubmissions(String authorizationHeader) {
        MeContextDto ctx = userDirectoryClient.fetchMeContext(authorizationHeader);

        List<TaskSubmission> submissions = taskSubmissionRepository.findAllByStatusWithTask(TaskSubmissionStatus.PENDING).stream()
                .filter(s -> canReviewSubmission(ctx, s))
                .toList();

        return submissions.stream()
                .map(s -> PendingTaskSubmissionResponse.builder()
                        .submissionId(s.getId())
                        .userId(s.getUserId())
                        .practicalTaskId(s.getPracticalTask().getId())
                        .taskTitle(s.getPracticalTask().getTitle())
                        .repositoryUrl(s.getRepositoryUrl())
                        .submittedAt(s.getSubmittedAt())
                        .build())
                .toList();
    }

    private boolean canReviewSubmission(MeContextDto ctx, TaskSubmission submission) {
        long orgId = submission.getPracticalTask().getLesson().getModule().getCourse().getOrganizationId();
        if (OrgAccess.isSuperCurator(ctx)) {
            return true;
        }
        if (ctx.getRole() == UserRole.EDUCATOR && OrgAccess.educatorOrganizationIds(ctx).contains(orgId)) {
            return true;
        }
        return ctx.getRole() == UserRole.CURATOR && OrgAccess.curatorOrganizationIds(ctx).contains(orgId);
    }

    @Transactional
    public TaskSubmissionResponse reviewSubmission(
            String authorizationHeader,
            Long submissionId,
            Long reviewerId,
            ReviewTaskSubmissionRequest request) {
        
        MeContextDto ctx = userDirectoryClient.fetchMeContext(authorizationHeader);
        TaskSubmission submission = taskSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Подання не знайдено"));

        if (!canReviewSubmission(ctx, submission)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (!ctx.getUserId().equals(reviewerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "reviewerId має збігатися з JWT");
        }

        submission.setStatus(request.getStatus());
        submission.setReviewerComment(request.getReviewerComment());
        submission.setReviewerId(reviewerId);
        submission.setReviewedAt(Instant.now());

        taskSubmissionRepository.save(submission);

        if (request.getStatus() == TaskSubmissionStatus.APPROVED) {
            enrollmentApplicationService.recalculateProgress(submission.getUserId(), submission.getPracticalTask().getLesson().getModule().getCourse());
        }

        return toResponse(submission);
    }

    @Transactional(readOnly = true)
    public TaskSubmissionResponse getMySubmission(Long userId, Long taskId) {
        return taskSubmissionRepository.findTopByUserIdAndPracticalTaskIdOrderBySubmittedAtDesc(userId, taskId)
                .map(this::toResponse)
                .orElse(null);
    }

    private TaskSubmissionResponse toResponse(TaskSubmission submission) {
        return TaskSubmissionResponse.builder()
                .id(submission.getId())
                .userId(submission.getUserId())
                .practicalTaskId(submission.getPracticalTask().getId())
                .repositoryUrl(submission.getRepositoryUrl())
                .status(submission.getStatus())
                .reviewerComment(submission.getReviewerComment())
                .reviewerId(submission.getReviewerId())
                .submittedAt(submission.getSubmittedAt())
                .reviewedAt(submission.getReviewedAt())
                .build();
    }
}
