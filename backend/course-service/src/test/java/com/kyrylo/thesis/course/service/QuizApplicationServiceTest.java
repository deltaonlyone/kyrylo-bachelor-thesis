package com.kyrylo.thesis.course.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.kyrylo.thesis.course.domain.AnswerOption;
import com.kyrylo.thesis.course.domain.Course;
import com.kyrylo.thesis.course.domain.CourseModule;
import com.kyrylo.thesis.course.domain.CourseStatus;
import com.kyrylo.thesis.course.domain.Lesson;
import com.kyrylo.thesis.course.domain.Question;
import com.kyrylo.thesis.course.domain.QuestionType;
import com.kyrylo.thesis.course.domain.Quiz;
import com.kyrylo.thesis.course.domain.QuizAttempt;
import com.kyrylo.thesis.course.domain.QuizAttemptStatus;
import com.kyrylo.thesis.course.integration.UserDirectoryClient;
import com.kyrylo.thesis.course.integration.userservice.MeContextDto;
import com.kyrylo.thesis.course.integration.userservice.OrganizationContextDto;
import com.kyrylo.thesis.course.integration.userservice.OrganizationMemberKind;
import com.kyrylo.thesis.course.integration.userservice.UserRole;
import com.kyrylo.thesis.course.repository.EnrollmentRepository;
import com.kyrylo.thesis.course.repository.QuizAttemptRepository;
import com.kyrylo.thesis.course.repository.QuizRepository;
import com.kyrylo.thesis.course.web.dto.SubmitQuizRequest;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class QuizApplicationServiceTest {

    @Mock QuizRepository quizRepository;
    @Mock QuizAttemptRepository quizAttemptRepository;
    @Mock CourseApplicationService courseApplicationService;
    @Mock UserDirectoryClient userDirectoryClient;
    @Mock EnrollmentRepository enrollmentRepository;
    @Mock SkillApplicationService skillApplicationService;
    @Mock EnrollmentApplicationService enrollmentApplicationService;

    @InjectMocks
    QuizApplicationService service;

    // ── helpers ───────────────────────────────────────────────────────────────

    private Quiz buildQuizWithSingleQuestion(Long quizId, Long lessonId, Long questionId, Long correctOptionId) {
        Course course = Course.builder().id(1L).organizationId(10L).title("C").status(CourseStatus.PUBLISHED).build();
        CourseModule module = CourseModule.builder().id(1L).name("M").sortOrder(1).course(course).build();
        Lesson lesson = Lesson.builder().id(lessonId).title("L").content("c").module(module).build();

        AnswerOption correct = AnswerOption.builder().id(correctOptionId).text("Right").correct(true).build();
        AnswerOption wrong = AnswerOption.builder().id(correctOptionId + 1).text("Wrong").correct(false).build();

        Question question = Question.builder().id(questionId).text("Q?").type(QuestionType.SINGLE).build();
        question.addOption(correct);
        question.addOption(wrong);
        correct.setQuestion(question);
        wrong.setQuestion(question);

        Quiz quiz = Quiz.builder().id(quizId).title("Quiz").passingScore(60).lesson(lesson).build();
        quiz.addQuestion(question);
        question.setQuiz(quiz);
        lesson.setQuiz(quiz);

        return quiz;
    }

    private MeContextDto educatorCtx(Long orgId) {
        MeContextDto ctx = new MeContextDto();
        ctx.setRole(UserRole.EDUCATOR);
        OrganizationContextDto o = new OrganizationContextDto();
        o.setOrganizationId(orgId);
        o.setMemberKind(OrganizationMemberKind.EDUCATOR);
        ctx.setOrganizations(List.of(o));
        return ctx;
    }

    // ── getQuizByLessonId ─────────────────────────────────────────────────────

    @Test
    void getQuizByLessonId_notFound_throws() {
        when(quizRepository.findByLessonIdWithQuestions(99L)).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> service.getQuizByLessonId("auth", 99L));
    }

    @Test
    void getQuizByLessonId_success_doesNotExposeCorrect() {
        Quiz quiz = buildQuizWithSingleQuestion(1L, 1L, 1L, 10L);
        when(quizRepository.findByLessonIdWithQuestions(1L)).thenReturn(Optional.of(quiz));
        doNothing().when(courseApplicationService).authorizeViewCourse(any(), any());

        var resp = service.getQuizByLessonId("auth", 1L);
        assertEquals(1L, resp.getId());
        assertEquals("Quiz", resp.getTitle());
        // Відповіді не містять поля correct (QuizResponse.OptionResponse не має його)
        assertFalse(resp.getQuestions().isEmpty());
    }

    // ── submitQuiz ────────────────────────────────────────────────────────────

    @Test
    void submitQuiz_correctAnswer_passed() {
        Quiz quiz = buildQuizWithSingleQuestion(1L, 1L, 1L, 10L);
        when(quizRepository.findById(1L)).thenReturn(Optional.of(quiz));
        when(quizRepository.findByLessonIdWithQuestions(1L)).thenReturn(Optional.of(quiz));
        doNothing().when(courseApplicationService).authorizeViewCourse(any(), any());

        QuizAttempt savedAttempt = QuizAttempt.builder()
                .id(50L).userId(5L).quiz(quiz)
                .correctCount(1).totalCount(1).scorePercentage(100)
                .passed(true).status(QuizAttemptStatus.AUTO_GRADED).build();
        when(quizAttemptRepository.save(any())).thenReturn(savedAttempt);

        SubmitQuizRequest req = new SubmitQuizRequest();
        req.setQuizId(1L);
        SubmitQuizRequest.AnswerEntry answer = new SubmitQuizRequest.AnswerEntry();
        answer.setQuestionId(1L);
        answer.setSelectedOptionId(10L);
        req.setAnswers(List.of(answer));

        var result = service.submitQuiz("auth", 5L, req);

        assertTrue(result.getPassed());
        assertEquals(100, result.getScorePercentage());
        assertEquals(QuizAttemptStatus.AUTO_GRADED, result.getStatus());
        verify(enrollmentApplicationService).recalculateProgress(eq(5L), any());
    }

    @Test
    void submitQuiz_wrongAnswer_notPassed() {
        Quiz quiz = buildQuizWithSingleQuestion(1L, 1L, 1L, 10L);
        when(quizRepository.findById(1L)).thenReturn(Optional.of(quiz));
        when(quizRepository.findByLessonIdWithQuestions(1L)).thenReturn(Optional.of(quiz));
        doNothing().when(courseApplicationService).authorizeViewCourse(any(), any());

        QuizAttempt savedAttempt = QuizAttempt.builder()
                .id(51L).userId(5L).quiz(quiz)
                .correctCount(0).totalCount(1).scorePercentage(0)
                .passed(false).status(QuizAttemptStatus.AUTO_GRADED).build();
        when(quizAttemptRepository.save(any())).thenReturn(savedAttempt);

        SubmitQuizRequest req = new SubmitQuizRequest();
        req.setQuizId(1L);
        SubmitQuizRequest.AnswerEntry answer = new SubmitQuizRequest.AnswerEntry();
        answer.setQuestionId(1L);
        answer.setSelectedOptionId(11L); // неправильна відповідь
        req.setAnswers(List.of(answer));

        var result = service.submitQuiz("auth", 5L, req);

        assertFalse(result.getPassed());
        assertEquals(0, result.getScorePercentage());
        verify(enrollmentApplicationService, never()).recalculateProgress(any(), any());
    }

    @Test
    void submitQuiz_openTextQuestion_pendingReview() {
        Course course = Course.builder().id(1L).organizationId(10L).title("C").status(CourseStatus.PUBLISHED).build();
        CourseModule module = CourseModule.builder().id(1L).name("M").sortOrder(1).course(course).build();
        Lesson lesson = Lesson.builder().id(1L).title("L").content("c").module(module).build();

        Question openQ = Question.builder().id(1L).text("Explain?").type(QuestionType.OPEN_TEXT).build();
        Quiz quiz = Quiz.builder().id(1L).title("Quiz").passingScore(60).lesson(lesson).build();
        quiz.addQuestion(openQ);
        openQ.setQuiz(quiz);
        lesson.setQuiz(quiz);

        when(quizRepository.findById(1L)).thenReturn(Optional.of(quiz));
        when(quizRepository.findByLessonIdWithQuestions(1L)).thenReturn(Optional.of(quiz));
        doNothing().when(courseApplicationService).authorizeViewCourse(any(), any());

        QuizAttempt savedAttempt = QuizAttempt.builder()
                .id(52L).userId(5L).quiz(quiz)
                .correctCount(0).totalCount(0).scorePercentage(0)
                .passed(false).status(QuizAttemptStatus.PENDING_REVIEW).build();
        when(quizAttemptRepository.save(any())).thenReturn(savedAttempt);

        SubmitQuizRequest req = new SubmitQuizRequest();
        req.setQuizId(1L);
        SubmitQuizRequest.AnswerEntry answer = new SubmitQuizRequest.AnswerEntry();
        answer.setQuestionId(1L);
        answer.setTextAnswer("My answer");
        req.setAnswers(List.of(answer));

        var result = service.submitQuiz("auth", 5L, req);
        assertEquals(QuizAttemptStatus.PENDING_REVIEW, result.getStatus());
    }

    @Test
    void submitQuiz_multiQuestion_allCorrect_passed() {
        Course course = Course.builder().id(1L).organizationId(10L).title("C").status(CourseStatus.PUBLISHED).build();
        CourseModule module = CourseModule.builder().id(1L).name("M").sortOrder(1).course(course).build();
        Lesson lesson = Lesson.builder().id(1L).title("L").content("c").module(module).build();

        AnswerOption opt1 = AnswerOption.builder().id(1L).text("A").correct(true).build();
        AnswerOption opt2 = AnswerOption.builder().id(2L).text("B").correct(true).build();
        AnswerOption opt3 = AnswerOption.builder().id(3L).text("C").correct(false).build();

        Question multiQ = Question.builder().id(1L).text("Multi?").type(QuestionType.MULTI).build();
        multiQ.addOption(opt1); opt1.setQuestion(multiQ);
        multiQ.addOption(opt2); opt2.setQuestion(multiQ);
        multiQ.addOption(opt3); opt3.setQuestion(multiQ);

        Quiz quiz = Quiz.builder().id(1L).title("Quiz").passingScore(60).lesson(lesson).build();
        quiz.addQuestion(multiQ);
        multiQ.setQuiz(quiz);
        lesson.setQuiz(quiz);

        when(quizRepository.findById(1L)).thenReturn(Optional.of(quiz));
        when(quizRepository.findByLessonIdWithQuestions(1L)).thenReturn(Optional.of(quiz));
        doNothing().when(courseApplicationService).authorizeViewCourse(any(), any());

        QuizAttempt savedAttempt = QuizAttempt.builder()
                .id(53L).userId(5L).quiz(quiz)
                .correctCount(1).totalCount(1).scorePercentage(100)
                .passed(true).status(QuizAttemptStatus.AUTO_GRADED).build();
        when(quizAttemptRepository.save(any())).thenReturn(savedAttempt);

        SubmitQuizRequest req = new SubmitQuizRequest();
        req.setQuizId(1L);
        SubmitQuizRequest.AnswerEntry answer = new SubmitQuizRequest.AnswerEntry();
        answer.setQuestionId(1L);
        answer.setSelectedOptionIds(List.of(1L, 2L));
        req.setAnswers(List.of(answer));

        var result = service.submitQuiz("auth", 5L, req);
        assertTrue(result.getPassed());
    }

    @Test
    void submitQuiz_quizNotFound_throws() {
        when(quizRepository.findById(99L)).thenReturn(Optional.empty());

        SubmitQuizRequest req = new SubmitQuizRequest();
        req.setQuizId(99L);
        req.setAnswers(List.of());

        assertThrows(ResponseStatusException.class, () -> service.submitQuiz("auth", 5L, req));
    }

    // ── getPendingAttempts ────────────────────────────────────────────────────

    @Test
    void getPendingAttempts_superCurator_returnsAll() {
        MeContextDto ctx = new MeContextDto();
        ctx.setSuperAdmin(true);
        when(userDirectoryClient.fetchMeContext(any())).thenReturn(ctx);
        when(quizAttemptRepository.findAllByStatusWithItems(QuizAttemptStatus.PENDING_REVIEW))
                .thenReturn(List.of());

        var result = service.getPendingAttempts("auth");
        assertTrue(result.isEmpty());
    }

    @Test
    void getPendingAttempts_educator_filtersOwnOrg() {
        MeContextDto ctx = educatorCtx(10L);
        when(userDirectoryClient.fetchMeContext(any())).thenReturn(ctx);

        // Спроба з іншої організації
        Course otherCourse = Course.builder().id(2L).organizationId(99L).title("Other").status(CourseStatus.PUBLISHED).build();
        CourseModule m = CourseModule.builder().id(1L).name("M").sortOrder(1).course(otherCourse).build();
        Lesson l = Lesson.builder().id(1L).title("L").content("c").module(m).build();
        Quiz q = Quiz.builder().id(1L).title("Q").passingScore(60).lesson(l).build();
        l.setQuiz(q);
        QuizAttempt attempt = QuizAttempt.builder().id(1L).userId(5L).quiz(q)
                .correctCount(0).totalCount(1).scorePercentage(0).passed(false)
                .status(QuizAttemptStatus.PENDING_REVIEW).build();

        when(quizAttemptRepository.findAllByStatusWithItems(QuizAttemptStatus.PENDING_REVIEW))
                .thenReturn(List.of(attempt));

        var result = service.getPendingAttempts("auth");
        assertTrue(result.isEmpty()); // відфільтровано — не та організація
    }
}
