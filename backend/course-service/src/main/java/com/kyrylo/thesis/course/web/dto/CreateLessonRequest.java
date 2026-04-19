package com.kyrylo.thesis.course.web.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateLessonRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String content;
}
