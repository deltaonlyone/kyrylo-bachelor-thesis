package com.kyrylo.thesis.course.web.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateAnswerOptionRequest {

    private Long id;

    @NotBlank
    private String text;

    private Boolean correct = false;
}
