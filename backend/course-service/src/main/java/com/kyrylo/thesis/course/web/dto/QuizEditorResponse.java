package com.kyrylo.thesis.course.web.dto;

import java.util.List;

import com.kyrylo.thesis.course.domain.QuestionType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Квіз для редагування куратором (містить прапори правильності варіантів).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizEditorResponse {

    private Long id;
    private String title;
    private Integer passingScore;
    private Long lessonId;
    private List<QuestionResponse> questions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionResponse {
        private Long id;
        private String text;
        private Integer sortOrder;
        private QuestionType type;
        private List<OptionResponse> options;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionResponse {
        private Long id;
        private String text;
        private Boolean correct;
    }
}
