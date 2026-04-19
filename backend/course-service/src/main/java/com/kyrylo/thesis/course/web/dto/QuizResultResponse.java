package com.kyrylo.thesis.course.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Результат перевірки квізу.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizResultResponse {

    private Long attemptId;
    private Long quizId;
    private Integer correctCount;
    private Integer totalCount;
    private Integer scorePercentage;
    private Integer passingScore;
    private Boolean passed;
}
