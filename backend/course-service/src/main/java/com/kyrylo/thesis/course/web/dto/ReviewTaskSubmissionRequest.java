package com.kyrylo.thesis.course.web.dto;

import com.kyrylo.thesis.course.domain.TaskSubmissionStatus;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewTaskSubmissionRequest {
    @NotNull(message = "Status cannot be null")
    private TaskSubmissionStatus status;
    private String reviewerComment;
}
