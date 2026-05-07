package com.kyrylo.thesis.course.web.dto;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingTaskSubmissionResponse {
    private Long submissionId;
    private Long userId;
    private Long practicalTaskId;
    private String taskTitle;
    private String repositoryUrl;
    private Instant submittedAt;
    
    // User info could be added if needed, or fetched on the frontend like for quizzes
}
