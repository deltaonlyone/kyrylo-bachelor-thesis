package com.kyrylo.thesis.course.web.dto;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Запит на перевірку квізу: список відповідей слухача
 * (questionId → обраний optionId).
 */
@Data
public class SubmitQuizRequest {

    @NotNull
    private Long quizId;

    @NotEmpty
    private List<AnswerEntry> answers;

    @Data
    public static class AnswerEntry {
        @NotNull
        private Long questionId;

        private Long selectedOptionId;

        private List<Long> selectedOptionIds;

        private String textAnswer;
    }
}
