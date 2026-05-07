package com.kyrylo.thesis.course.web.dto;

import java.time.Instant;

import com.kyrylo.thesis.course.domain.TaskSubmissionStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskSubmissionResponse {
    private Long id;
    private Long userId;
    private Long practicalTaskId;
    private String repositoryUrl;
    private TaskSubmissionStatus status;
    private String reviewerComment;
    private Long reviewerId;
    private Instant submittedAt;
    private Instant reviewedAt;
}
