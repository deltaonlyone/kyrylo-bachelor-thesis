package com.kyrylo.thesis.course.service;

import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kyrylo.thesis.course.domain.AnswerOption;
import com.kyrylo.thesis.course.domain.Question;
import com.kyrylo.thesis.course.domain.Quiz;
import com.kyrylo.thesis.course.domain.QuizAttempt;
import com.kyrylo.thesis.course.repository.QuizAttemptRepository;
import com.kyrylo.thesis.course.repository.QuizRepository;
import com.kyrylo.thesis.course.web.dto.QuizResponse;
import com.kyrylo.thesis.course.web.dto.QuizResultResponse;
import com.kyrylo.thesis.course.web.dto.SubmitQuizRequest;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class QuizApplicationService {

    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    /**
     * Отримати квіз для уроку (без позначок правильних відповідей).
     */
    @Transactional(readOnly = true)
    public QuizResponse getQuizByLessonId(Long lessonId) {
        Quiz quiz = quizRepository.findByLessonIdWithQuestions(lessonId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Тест для цього уроку не знайдено"));
        return toResponse(quiz);
    }

    /**
     * Перевірити відповіді слухача та зберегти результат.
     */
    @Transactional
    public QuizResultResponse submitQuiz(Long userId, SubmitQuizRequest request) {
        Quiz quiz = quizRepository.findByLessonIdWithQuestions(
                        quizRepository.findById(request.getQuizId())
                                .orElseThrow(() -> new ResponseStatusException(
                                        HttpStatus.NOT_FOUND, "Тест не знайдено"))
                                .getLesson().getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Тест не знайдено"));

        // Побудувати карту правильних відповідей: questionId -> correctOptionId
        Map<Long, Long> correctAnswers = quiz.getQuestions().stream()
                .collect(Collectors.toMap(
                        Question::getId,
                        q -> q.getOptions().stream()
                                .filter(AnswerOption::getCorrect)
                                .findFirst()
                                .map(AnswerOption::getId)
                                .orElse(-1L)
                ));

        int totalCount = quiz.getQuestions().size();
        int correctCount = 0;

        for (SubmitQuizRequest.AnswerEntry answer : request.getAnswers()) {
            Long correctOptionId = correctAnswers.get(answer.getQuestionId());
            if (correctOptionId != null && correctOptionId.equals(answer.getSelectedOptionId())) {
                correctCount++;
            }
        }

        int scorePercentage = totalCount > 0
                ? Math.round((float) correctCount / totalCount * 100)
                : 0;
        boolean passed = scorePercentage >= quiz.getPassingScore();

        QuizAttempt attempt = QuizAttempt.builder()
                .userId(userId)
                .quiz(quiz)
                .correctCount(correctCount)
                .totalCount(totalCount)
                .scorePercentage(scorePercentage)
                .passed(passed)
                .attemptedAt(Instant.now())
                .build();

        QuizAttempt saved = quizAttemptRepository.save(attempt);

        return QuizResultResponse.builder()
                .attemptId(saved.getId())
                .quizId(quiz.getId())
                .correctCount(correctCount)
                .totalCount(totalCount)
                .scorePercentage(scorePercentage)
                .passingScore(quiz.getPassingScore())
                .passed(passed)
                .build();
    }

    private QuizResponse toResponse(Quiz quiz) {
        return QuizResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .passingScore(quiz.getPassingScore())
                .lessonId(quiz.getLesson().getId())
                .questions(quiz.getQuestions().stream()
                        .map(q -> QuizResponse.QuestionResponse.builder()
                                .id(q.getId())
                                .text(q.getText())
                                .sortOrder(q.getSortOrder())
                                .options(q.getOptions().stream()
                                        .map(o -> QuizResponse.OptionResponse.builder()
                                                .id(o.getId())
                                                .text(o.getText())
                                                .build())
                                        .toList())
                                .build())
                        .toList())
                .build();
    }
}
