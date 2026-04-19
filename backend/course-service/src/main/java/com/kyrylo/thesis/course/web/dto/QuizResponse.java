package com.kyrylo.thesis.course.web.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Відповідь із квізом для відображення слухачу.
 * НЕ містить інформацію про правильність варіантів.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizResponse {

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
        private List<OptionResponse> options;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionResponse {
        private Long id;
        private String text;
        // НЕ включаємо поле correct — слухач не повинен бачити правильну відповідь
    }
}
