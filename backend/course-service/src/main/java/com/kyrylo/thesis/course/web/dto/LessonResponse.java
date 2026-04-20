package com.kyrylo.thesis.course.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonResponse {

    private Long id;
    private String title;
    private String content;

    /** Чи є тест (квіз) до цього уроку. */
    @Builder.Default
    private Boolean hasQuiz = false;

    private QuizResponse quiz;
}
