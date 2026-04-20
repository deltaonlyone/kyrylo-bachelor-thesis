package com.kyrylo.thesis.course.web.dto;

import java.util.ArrayList;
import java.util.List;

import com.kyrylo.thesis.course.domain.QuestionType;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateQuestionRequest {

    private Long id;

    @NotBlank
    private String text;

    @NotNull
    private Integer sortOrder;

    @NotNull
    private QuestionType type;

    @Valid
    private List<CreateAnswerOptionRequest> options = new ArrayList<>();
}
