package com.kyrylo.thesis.course.service;

import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kyrylo.thesis.course.domain.AnswerOption;
import com.kyrylo.thesis.course.domain.Question;
import com.kyrylo.thesis.course.domain.QuestionType;
import com.kyrylo.thesis.course.domain.Quiz;
import com.kyrylo.thesis.course.domain.QuizAttempt;
import com.kyrylo.thesis.course.domain.QuizAttemptItem;
import com.kyrylo.thesis.course.domain.QuizAttemptStatus;
import com.kyrylo.thesis.course.integration.UserDirectoryClient;
import com.kyrylo.thesis.course.integration.userservice.MeContextDto;
import com.kyrylo.thesis.course.integration.userservice.UserRole;
import com.kyrylo.thesis.course.repository.QuizAttemptRepository;
import com.kyrylo.thesis.course.repository.QuizRepository;
import com.kyrylo.thesis.course.web.dto.PendingQuizAttemptResponse;
import com.kyrylo.thesis.course.web.dto.QuizEditorResponse;
import com.kyrylo.thesis.course.web.dto.QuizResponse;
import com.kyrylo.thesis.course.web.dto.QuizResultResponse;
import com.kyrylo.thesis.course.web.dto.ReviewQuizAttemptRequest;
import com.kyrylo.thesis.course.web.dto.SubmitQuizRequest;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class QuizApplicationService {

    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final CourseApplicationService courseApplicationService;
    private final UserDirectoryClient userDirectoryClient;

    /**
     * Отримати квіз для уроку (без позначок правильних відповідей).
     */
    @Transactional(readOnly = true)
    public QuizResponse getQuizByLessonId(String authorizationHeader, Long lessonId) {
        Quiz quiz = quizRepository.findByLessonIdWithQuestions(lessonId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Тест для цього уроку не знайдено"));
        courseApplicationService.authorizeViewCourse(
                authorizationHeader, quiz.getLesson().getModule().getCourse());
        return toResponse(quiz);
    }

    /**
     * Квіз для редагування куратором (з прапором correct на варіантах).
     */
    @Transactional(readOnly = true)
    public QuizEditorResponse getQuizForEditing(String authorizationHeader, Long lessonId) {
        Quiz quiz = quizRepository.findByLessonIdWithQuestions(lessonId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Тест для цього уроку не знайдено"));
        courseApplicationService.authorizeEditCourse(
                authorizationHeader, quiz.getLesson().getModule().getCourse());
        return toEditorResponse(quiz);
    }

    /**
     * Перевірити відповіді слухача та зберегти результат.
     */
    @Transactional
    public QuizResultResponse submitQuiz(String authorizationHeader, Long userId, SubmitQuizRequest request) {
        Quiz quizFull = quizRepository.findById(request.getQuizId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Тест не знайдено"));

        Quiz quiz = quizRepository.findByLessonIdWithQuestions(quizFull.getLesson().getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Тест не знайдено"));

        courseApplicationService.authorizeViewCourse(
                authorizationHeader, quiz.getLesson().getModule().getCourse());

        if (!quiz.getId().equals(request.getQuizId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Невідповідний ідентифікатор тесту");
        }

        Map<Long, SubmitQuizRequest.AnswerEntry> submitted = request.getAnswers().stream()
                .collect(Collectors.toMap(SubmitQuizRequest.AnswerEntry::getQuestionId, a -> a, (a, b) -> b));

        int totalCount = (int) quiz.getQuestions().stream()
                .filter(q -> q.getType() != QuestionType.OPEN_TEXT)
                .count();
        int correctCount = 0;
        boolean hasOpen = false;

        QuizAttempt attempt = QuizAttempt.builder()
                .userId(userId)
                .quiz(quiz)
                .correctCount(0)
                .totalCount(totalCount)
                .scorePercentage(0)
                .passed(false)
                .attemptedAt(Instant.now())
                .build();

        for (Question question : quiz.getQuestions()) {
            SubmitQuizRequest.AnswerEntry answer = submitted.get(question.getId());
            QuizAttemptItem item = QuizAttemptItem.builder()
                    .question(question)
                    .build();

            if (question.getType() == QuestionType.OPEN_TEXT) {
                hasOpen = true;
                item.setTextAnswer(answer == null ? null : answer.getTextAnswer());
                item.setAutoCorrect(false);
            } else if (question.getType() == QuestionType.MULTI) {
                Set<Long> expected = question.getOptions().stream()
                        .filter(AnswerOption::getCorrect)
                        .map(AnswerOption::getId)
                        .collect(Collectors.toSet());
                Set<Long> actual = answer == null || answer.getSelectedOptionIds() == null
                        ? new HashSet<>()
                        : new HashSet<>(answer.getSelectedOptionIds());
                boolean ok = !expected.isEmpty() && expected.equals(actual);
                if (ok) {
                    correctCount++;
                }
                item.setSelectedOptionIds(actual.stream().map(String::valueOf).collect(Collectors.joining(",")));
                item.setAutoCorrect(ok);
            } else {
                Long selectedId = answer == null ? null : answer.getSelectedOptionId();
                Long correctOptionId = question.getOptions().stream()
                        .filter(AnswerOption::getCorrect)
                        .findFirst()
                        .map(AnswerOption::getId)
                        .orElse(null);
                boolean ok = selectedId != null && selectedId.equals(correctOptionId);
                if (ok) {
                    correctCount++;
                }
                item.setSelectedOptionIds(selectedId == null ? null : String.valueOf(selectedId));
                item.setAutoCorrect(ok);
            }
            attempt.addItem(item);
        }

        int scorePercentage = totalCount > 0
                ? Math.round((float) correctCount / totalCount * 100)
                : 0;
        boolean passed = scorePercentage >= quiz.getPassingScore();
        attempt.setCorrectCount(correctCount);
        attempt.setScorePercentage(scorePercentage);
        attempt.setPassed(passed);
        attempt.setStatus(hasOpen ? QuizAttemptStatus.PENDING_REVIEW : QuizAttemptStatus.AUTO_GRADED);

        QuizAttempt saved = quizAttemptRepository.save(attempt);

        return QuizResultResponse.builder()
                .attemptId(saved.getId())
                .quizId(quiz.getId())
                .correctCount(correctCount)
                .totalCount(totalCount)
                .scorePercentage(scorePercentage)
                .passingScore(quiz.getPassingScore())
                .passed(passed)
                .status(saved.getStatus())
                .build();
    }

    @Transactional(readOnly = true)
    public List<PendingQuizAttemptResponse> getPendingAttempts(String authorizationHeader) {
        MeContextDto ctx = userDirectoryClient.fetchMeContext(authorizationHeader);

        var attempts = quizAttemptRepository.findAllByStatusWithItems(QuizAttemptStatus.PENDING_REVIEW).stream()
                .filter(a -> canReviewAttempt(ctx, a))
                .toList();

        return attempts.stream()
                .map(a -> PendingQuizAttemptResponse.builder()
                        .attemptId(a.getId())
                        .userId(a.getUserId())
                        .quizId(a.getQuiz().getId())
                        .quizTitle(a.getQuiz().getTitle())
                        .attemptedAt(a.getAttemptedAt())
                        .openItems(a.getItems().stream()
                                .filter(i -> i.getQuestion().getType() == QuestionType.OPEN_TEXT)
                                .map(i -> PendingQuizAttemptResponse.Item.builder()
                                        .itemId(i.getId())
                                        .questionId(i.getQuestion().getId())
                                        .questionText(i.getQuestion().getText())
                                        .textAnswer(i.getTextAnswer())
                                        .manualPoints(i.getManualPoints())
                                        .build())
                                .toList())
                        .build())
                .toList();
    }

    private boolean canReviewAttempt(MeContextDto ctx, QuizAttempt attempt) {
        long orgId = attempt.getQuiz().getLesson().getModule().getCourse().getOrganizationId();
        if (OrgAccess.isSuperCurator(ctx)) {
            return true;
        }
        if (ctx.getRole() == UserRole.EDUCATOR && OrgAccess.educatorOrganizationIds(ctx).contains(orgId)) {
            return true;
        }
        return ctx.getRole() == UserRole.CURATOR && OrgAccess.curatorOrganizationIds(ctx).contains(orgId);
    }

    @Transactional
    public QuizResultResponse reviewAttempt(
            String authorizationHeader,
            Long attemptId,
            Long reviewerId,
            ReviewQuizAttemptRequest request) {
        MeContextDto ctx = userDirectoryClient.fetchMeContext(authorizationHeader);
        QuizAttempt attempt = quizAttemptRepository.findByIdWithDetail(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Спробу не знайдено"));

        if (!canReviewAttempt(ctx, attempt)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (!ctx.getUserId().equals(reviewerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "reviewerId має збігатися з JWT");
        }
        Map<Long, QuizAttemptItem> byId = new HashMap<>();
        for (QuizAttemptItem item : attempt.getItems()) {
            byId.put(item.getId(), item);
        }

        for (ReviewQuizAttemptRequest.ItemReview review : request.getReviews()) {
            QuizAttemptItem item = byId.get(review.getItemId());
            if (item == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Пункт відповіді не належить спробі");
            }
            item.setManualPoints(review.getManualPoints());
            item.setReviewedBy(reviewerId);
            item.setReviewedAt(Instant.now());
        }

        int autoCorrect = attempt.getItems().stream()
                .filter(i -> Boolean.TRUE.equals(i.getAutoCorrect()))
                .mapToInt(i -> 1)
                .sum();
        int manualCorrect = attempt.getItems().stream()
                .filter(i -> i.getQuestion().getType() == QuestionType.OPEN_TEXT)
                .mapToInt(i -> i.getManualPoints() != null && i.getManualPoints() > 0 ? 1 : 0)
                .sum();
        int totalCount = attempt.getTotalCount() + (int) attempt.getItems().stream()
                .filter(i -> i.getQuestion().getType() == QuestionType.OPEN_TEXT)
                .count();
        int correctCount = autoCorrect + manualCorrect;
        int scorePercentage = totalCount > 0
                ? Math.round((float) correctCount / totalCount * 100)
                : 0;
        boolean passed = scorePercentage >= attempt.getQuiz().getPassingScore();

        attempt.setCorrectCount(correctCount);
        attempt.setTotalCount(totalCount);
        attempt.setScorePercentage(scorePercentage);
        attempt.setPassed(passed);
        attempt.setStatus(QuizAttemptStatus.REVIEWED);
        quizAttemptRepository.save(attempt);

        return QuizResultResponse.builder()
                .attemptId(attempt.getId())
                .quizId(attempt.getQuiz().getId())
                .correctCount(correctCount)
                .totalCount(totalCount)
                .scorePercentage(scorePercentage)
                .passingScore(attempt.getQuiz().getPassingScore())
                .passed(passed)
                .status(attempt.getStatus())
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
                                .type(q.getType())
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

    private QuizEditorResponse toEditorResponse(Quiz quiz) {
        return QuizEditorResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .passingScore(quiz.getPassingScore())
                .lessonId(quiz.getLesson().getId())
                .questions(quiz.getQuestions().stream()
                        .map(q -> QuizEditorResponse.QuestionResponse.builder()
                                .id(q.getId())
                                .text(q.getText())
                                .sortOrder(q.getSortOrder())
                                .type(q.getType())
                                .options(q.getOptions().stream()
                                        .map(o -> QuizEditorResponse.OptionResponse.builder()
                                                .id(o.getId())
                                                .text(o.getText())
                                                .correct(o.getCorrect())
                                                .build())
                                        .toList())
                                .build())
                        .toList())
                .build();
    }
}
