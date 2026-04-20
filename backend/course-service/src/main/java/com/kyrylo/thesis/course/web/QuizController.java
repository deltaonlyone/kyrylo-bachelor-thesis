package com.kyrylo.thesis.course.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kyrylo.thesis.course.security.SecurityUserPrincipal;
import com.kyrylo.thesis.course.service.QuizApplicationService;
import com.kyrylo.thesis.course.web.dto.PendingQuizAttemptResponse;
import com.kyrylo.thesis.course.web.dto.QuizEditorResponse;
import com.kyrylo.thesis.course.web.dto.QuizResponse;
import com.kyrylo.thesis.course.web.dto.QuizResultResponse;
import com.kyrylo.thesis.course.web.dto.ReviewQuizAttemptRequest;
import com.kyrylo.thesis.course.web.dto.SubmitQuizRequest;

import jakarta.servlet.http.HttpServletRequest;
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

    @GetMapping("/lesson/{lessonId}")
    public QuizResponse getQuizByLesson(HttpServletRequest httpRequest, @PathVariable Long lessonId) {
        return quizService.getQuizByLessonId(bearer(httpRequest), lessonId);
    }

    @GetMapping("/lesson/{lessonId}/editor")
    public QuizEditorResponse getQuizByLessonForEdit(HttpServletRequest httpRequest, @PathVariable Long lessonId) {
        return quizService.getQuizForEditing(bearer(httpRequest), lessonId);
    }

    @PostMapping("/submit")
    public QuizResultResponse submitQuiz(
            HttpServletRequest httpRequest,
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @Valid @RequestBody SubmitQuizRequest request) {
        return quizService.submitQuiz(bearer(httpRequest), principal.userId(), request);
    }

    @GetMapping("/attempts/pending")
    public List<PendingQuizAttemptResponse> pendingAttempts(HttpServletRequest httpRequest) {
        return quizService.getPendingAttempts(bearer(httpRequest));
    }

    @PostMapping("/attempts/{attemptId}/review")
    public QuizResultResponse reviewAttempt(
            HttpServletRequest httpRequest,
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @PathVariable Long attemptId,
            @Valid @RequestBody ReviewQuizAttemptRequest request) {
        return quizService.reviewAttempt(bearer(httpRequest), attemptId, principal.userId(), request);
    }

    private static String bearer(HttpServletRequest req) {
        String h = req.getHeader(org.springframework.http.HttpHeaders.AUTHORIZATION);
        if (h == null || !h.startsWith("Bearer ")) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Потрібен заголовок Authorization");
        }
        return h;
    }
}
