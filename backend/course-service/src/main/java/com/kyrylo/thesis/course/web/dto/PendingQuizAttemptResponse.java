package com.kyrylo.thesis.course.web.dto;

import java.time.Instant;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingQuizAttemptResponse {
    private Long attemptId;
    private Long userId;
    private Long quizId;
    private String quizTitle;
    private Instant attemptedAt;
    private List<Item> openItems;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {
        private Long itemId;
        private Long questionId;
        private String questionText;
        private String textAnswer;
        private Integer manualPoints;
    }
}
