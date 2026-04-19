package com.kyrylo.thesis.course.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kyrylo.thesis.course.service.QuizApplicationService;
import com.kyrylo.thesis.course.web.dto.QuizResponse;
import com.kyrylo.thesis.course.web.dto.QuizResultResponse;
import com.kyrylo.thesis.course.web.dto.SubmitQuizRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Ендпоінти тестування (квізів).
 */
@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizApplicationService quizService;

    /**
     * GET /api/quizzes/lesson/{lessonId} — отримати квіз для уроку
     * (без правильних відповідей).
     */
    @GetMapping("/lesson/{lessonId}")
    public QuizResponse getQuizByLesson(@PathVariable Long lessonId) {
        return quizService.getQuizByLessonId(lessonId);
    }

    /**
     * POST /api/quizzes/submit — перевірити відповіді слухача.
     * userId береться з заголовка X-User-Id.
     */
    @PostMapping("/submit")
    public QuizResultResponse submitQuiz(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody SubmitQuizRequest request) {
        return quizService.submitQuiz(userId, request);
    }
}
