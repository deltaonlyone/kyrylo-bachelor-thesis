package com.kyrylo.thesis.course.web.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitTaskRequest {
    @NotBlank(message = "Repository URL cannot be blank")
    private String repositoryUrl;
}
