package com.kyrylo.thesis.course.web.dto;

import java.util.List;

import com.kyrylo.thesis.course.domain.EnrollmentStatus;
import com.kyrylo.thesis.course.domain.TaskSubmissionStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Детальний прогрес слухача по курсу: загальний відсоток та статус по кожному уроку.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseProgressResponse {

    private EnrollmentStatus enrollmentStatus;
    private Integer progressPercentage;
    private List<LessonProgress> lessonProgresses;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LessonProgress {
        private Long lessonId;
        private boolean hasQuiz;
        private Boolean quizPassed;
        private boolean hasPracticalTask;
        private TaskSubmissionStatus taskStatus;
        /** true якщо всі обов'язкові елементи уроку пройдені. */
        private boolean completed;
    }
}
