package com.kyrylo.thesis.course.web.dto;

import java.util.ArrayList;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateQuizRequest {

    private Long id;

    @NotBlank
    private String title;

    @NotNull
    @Min(0)
    @Max(100)
    private Integer passingScore;

    @NotNull
    @Valid
    private List<CreateQuestionRequest> questions = new ArrayList<>();
}
