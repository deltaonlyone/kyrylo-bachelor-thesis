package com.kyrylo.thesis.course.service;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kyrylo.thesis.course.domain.AnswerOption;
import com.kyrylo.thesis.course.domain.Course;
import com.kyrylo.thesis.course.domain.CourseModule;
import com.kyrylo.thesis.course.domain.Enrollment;
import com.kyrylo.thesis.course.domain.Lesson;
import com.kyrylo.thesis.course.domain.Question;
import com.kyrylo.thesis.course.domain.QuestionType;
import com.kyrylo.thesis.course.domain.CourseStatus;
import com.kyrylo.thesis.course.domain.Quiz;
import com.kyrylo.thesis.course.integration.UserDirectoryClient;
import com.kyrylo.thesis.course.integration.userservice.MeContextDto;
import com.kyrylo.thesis.course.integration.userservice.UserRole;
import com.kyrylo.thesis.course.repository.CourseRepository;
import com.kyrylo.thesis.course.repository.EnrollmentRepository;
import com.kyrylo.thesis.course.web.dto.CourseModuleResponse;
import com.kyrylo.thesis.course.web.dto.CourseResponse;
import com.kyrylo.thesis.course.web.dto.CourseSummaryResponse;
import com.kyrylo.thesis.course.web.dto.CreateCourseRequest;
import com.kyrylo.thesis.course.web.dto.CreateLessonRequest;
import com.kyrylo.thesis.course.web.dto.CreateModuleRequest;
import com.kyrylo.thesis.course.web.dto.CreateQuestionRequest;
import com.kyrylo.thesis.course.web.dto.CreateQuizRequest;
import com.kyrylo.thesis.course.web.dto.LessonResponse;
import com.kyrylo.thesis.course.web.dto.QuizResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class CourseApplicationService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserDirectoryClient userDirectoryClient;

    @Transactional
    public CourseResponse createCourse(String authorizationHeader, CreateCourseRequest request) {
        MeContextDto ctx = userDirectoryClient.fetchMeContext(authorizationHeader);
        assertCuratorCanManageOrganization(ctx, request.getOrganizationId());

        Course course = Course.builder()
                .organizationId(request.getOrganizationId())
                .title(request.getTitle().trim())
                .description(trimToNull(request.getDescription()))
                .status(request.getStatus())
                .build();
        mergeModules(course, request.getModules(), false);
        Course saved = courseRepository.save(course);
        return toResponse(requireWithStructure(saved.getId()));
    }

    @Transactional(readOnly = true)
    public List<CourseSummaryResponse> listCourses(String authorizationHeader) {
        MeContextDto ctx = userDirectoryClient.fetchMeContext(authorizationHeader);

        if (OrgAccess.isSuperCurator(ctx)) {
            return courseRepository.findAll().stream()
                    .sorted(Comparator.comparing(Course::getId))
                    .map(this::toSummary)
                    .toList();
        }
        if (ctx.getRole() == UserRole.CURATOR) {
            Set<Long> orgIds = OrgAccess.curatorOrganizationIds(ctx);
            if (orgIds.isEmpty()) {
                return List.of();
            }
            return courseRepository.findByOrganizationIdIn(orgIds).stream()
                    .sorted(Comparator.comparing(Course::getId))
                    .map(this::toSummary)
                    .toList();
        }
        if (ctx.getRole() == UserRole.EDUCATOR) {
            Set<Long> orgIds = OrgAccess.educatorOrganizationIds(ctx);
            if (orgIds.isEmpty()) {
                return List.of();
            }
            return courseRepository.findByOrganizationIdIn(orgIds).stream()
                    .sorted(Comparator.comparing(Course::getId))
                    .map(this::toSummary)
                    .toList();
        }
        if (ctx.getRole() == UserRole.LEARNER) {
            List<Long> enrolledCourseIds = enrollmentRepository.findByUserId(ctx.getUserId()).stream()
                    .map(Enrollment::getCourseId)
                    .toList();
            if (enrolledCourseIds.isEmpty()) {
                return List.of();
            }
            return courseRepository.findAllById(enrolledCourseIds).stream()
                    .filter(c -> c.getStatus() == CourseStatus.PUBLISHED)
                    .sorted(Comparator.comparing(Course::getId))
                    .map(this::toSummary)
                    .toList();
        }
        return List.of();
    }

    @Transactional(readOnly = true)
    public CourseResponse getCourse(String authorizationHeader, Long id) {
        Course course = requireWithStructure(id);
        MeContextDto ctx = userDirectoryClient.fetchMeContext(authorizationHeader);
        assertCanViewCourse(ctx, course);
        return toResponse(course);
    }

    @Transactional
    public CourseResponse updateCourse(String authorizationHeader, Long id, CreateCourseRequest request) {
        Course course = courseRepository.findByIdWithStructure(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        MeContextDto ctx = userDirectoryClient.fetchMeContext(authorizationHeader);
        assertCanEditCourse(ctx, course);
        if (!course.getOrganizationId().equals(request.getOrganizationId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Не можна змінити організацію курсу");
        }

        course.setTitle(request.getTitle().trim());
        course.setDescription(trimToNull(request.getDescription()));
        course.setStatus(request.getStatus());
        mergeModules(course, request.getModules(), true);
        courseRepository.save(course);
        return toResponse(requireWithStructure(id));
    }

    @Transactional
    public void deleteCourse(String authorizationHeader, Long id) {
        Course course = courseRepository.findByIdWithStructure(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        MeContextDto ctx = userDirectoryClient.fetchMeContext(authorizationHeader);
        assertCanEditCourse(ctx, course);
        courseRepository.deleteById(id);
    }

    private void assertCuratorCanManageOrganization(MeContextDto ctx, Long organizationId) {
        if (ctx.getRole() != UserRole.CURATOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Лише куратор може керувати курсами");
        }
        if (OrgAccess.isSuperCurator(ctx)) {
            return;
        }
        boolean ok = OrgAccess.curatorOrganizationIds(ctx).contains(organizationId);
        if (!ok) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Немає доступу до цієї організації");
        }
    }

    private void assertCanViewCourse(MeContextDto ctx, Course course) {
        if (OrgAccess.isSuperCurator(ctx)) {
            return;
        }
        Long oid = course.getOrganizationId();
        if (ctx.getRole() == UserRole.CURATOR && OrgAccess.curatorOrganizationIds(ctx).contains(oid)) {
            return;
        }
        if (ctx.getRole() == UserRole.EDUCATOR && OrgAccess.educatorOrganizationIds(ctx).contains(oid)) {
            return;
        }
        if (ctx.getRole() == UserRole.LEARNER) {
            if (enrollmentRepository.existsByUserIdAndCourseId(ctx.getUserId(), course.getId())) {
                return;
            }
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Немає доступу до курсу");
    }

    private void assertCanEditCourse(MeContextDto ctx, Course course) {
        if (OrgAccess.isSuperCurator(ctx)) {
            return;
        }
        if (ctx.getRole() == UserRole.CURATOR
                && OrgAccess.curatorOrganizationIds(ctx).contains(course.getOrganizationId())) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Немає прав на зміну курсу");
    }

    /** Для інших сервісів (квізи): перевірка перегляду курсу. */
    public void authorizeViewCourse(String authorizationHeader, Course course) {
        MeContextDto ctx = userDirectoryClient.fetchMeContext(authorizationHeader);
        assertCanViewCourse(ctx, course);
    }

    /** Редагування структури курсу / квізу в редакторі. */
    public void authorizeEditCourse(String authorizationHeader, Course course) {
        MeContextDto ctx = userDirectoryClient.fetchMeContext(authorizationHeader);
        assertCanEditCourse(ctx, course);
    }

    private CourseSummaryResponse toSummary(Course c) {
        return CourseSummaryResponse.builder()
                .id(c.getId())
                .organizationId(c.getOrganizationId())
                .title(c.getTitle())
                .status(c.getStatus())
                .build();
    }

    private Course requireWithStructure(Long id) {
        return courseRepository.findByIdWithStructure(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private void mergeModules(Course course, List<CreateModuleRequest> moduleRequests, boolean allowIds) {
        Map<Long, CourseModule> existing = new HashMap<>();
        for (CourseModule module : course.getModules()) {
            if (module.getId() != null) {
                existing.put(module.getId(), module);
            }
        }

        List<CourseModule> nextModules = new java.util.ArrayList<>();

        for (CreateModuleRequest mr : moduleRequests) {
            CourseModule module;
            if (allowIds && mr.getId() != null) {
                module = existing.get(mr.getId());
                if (module == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Модуль не належить курсу");
                }
            } else {
                module = CourseModule.builder().build();
                module.setCourse(course);
            }

            module.setName(mr.getName().trim());
            module.setSortOrder(mr.getSortOrder());
            mergeLessons(module, mr.getLessons(), allowIds);
            nextModules.add(module);
        }

        course.getModules().clear();
        for (CourseModule module : nextModules) {
            course.addModule(module);
        }
    }

    private void mergeLessons(CourseModule module, List<CreateLessonRequest> lessonRequests, boolean allowIds) {
        Map<Long, Lesson> existing = new HashMap<>();
        for (Lesson lesson : module.getLessons()) {
            if (lesson.getId() != null) {
                existing.put(lesson.getId(), lesson);
            }
        }

        List<Lesson> nextLessons = new java.util.ArrayList<>();
        for (CreateLessonRequest lr : lessonRequests) {
            Lesson lesson;
            if (allowIds && lr.getId() != null) {
                lesson = existing.get(lr.getId());
                if (lesson == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Урок не належить модулю");
                }
            } else {
                lesson = Lesson.builder().build();
                lesson.setModule(module);
            }

            lesson.setTitle(lr.getTitle().trim());
            lesson.setContent(lr.getContent());
            mergeQuiz(lesson, lr.getQuiz(), allowIds);
            mergePracticalTask(lesson, lr.getPracticalTask(), allowIds);
            nextLessons.add(lesson);
        }

        module.getLessons().clear();
        for (Lesson lesson : nextLessons) {
            module.addLesson(lesson);
        }
    }

    private void mergePracticalTask(Lesson lesson, com.kyrylo.thesis.course.web.dto.CreatePracticalTaskRequest request, boolean allowIds) {
        if (request == null) {
            lesson.setPracticalTask(null);
            return;
        }

        com.kyrylo.thesis.course.domain.PracticalTask task = lesson.getPracticalTask();
        if (task == null || !allowIds) {
            task = com.kyrylo.thesis.course.domain.PracticalTask.builder().build();
            task.setLesson(lesson);
            lesson.setPracticalTask(task);
        } else if (request.getId() != null && task.getId() != null && !task.getId().equals(request.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Практичне завдання не належить уроку");
        }

        task.setTitle(request.getTitle().trim());
        task.setDescription(request.getDescription().trim());
    }

    private void mergeQuiz(Lesson lesson, CreateQuizRequest request, boolean allowIds) {
        if (request == null) {
            lesson.setQuiz(null);
            return;
        }

        Quiz quiz = lesson.getQuiz();
        if (quiz == null || !allowIds) {
            quiz = Quiz.builder().build();
            quiz.setLesson(lesson);
            lesson.setQuiz(quiz);
        } else if (request.getId() != null && quiz.getId() != null && !quiz.getId().equals(request.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Тест не належить уроку");
        }

        quiz.setTitle(request.getTitle().trim());
        quiz.setPassingScore(request.getPassingScore());

        Map<Long, Question> existing = new HashMap<>();
        for (Question question : quiz.getQuestions()) {
            if (question.getId() != null) {
                existing.put(question.getId(), question);
            }
        }

        List<Question> nextQuestions = new java.util.ArrayList<>();
        for (CreateQuestionRequest qr : request.getQuestions()) {
            Question question;
            if (allowIds && qr.getId() != null) {
                question = existing.get(qr.getId());
                if (question == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Питання не належить тесту");
                }
            } else {
                question = Question.builder().build();
                question.setQuiz(quiz);
            }

            question.setText(qr.getText().trim());
            question.setSortOrder(qr.getSortOrder());
            question.setType(qr.getType());
            mergeOptions(question, qr.getType(), qr.getOptions(), allowIds);
            nextQuestions.add(question);
        }

        quiz.getQuestions().clear();
        for (Question question : nextQuestions) {
            quiz.addQuestion(question);
        }
    }

    private void mergeOptions(
            Question question,
            QuestionType type,
            List<com.kyrylo.thesis.course.web.dto.CreateAnswerOptionRequest> options,
            boolean allowIds) {
        Map<Long, AnswerOption> existing = new HashMap<>();
        for (AnswerOption option : question.getOptions()) {
            if (option.getId() != null) {
                existing.put(option.getId(), option);
            }
        }

        List<AnswerOption> nextOptions = new java.util.ArrayList<>();
        if (type == QuestionType.OPEN_TEXT) {
            question.getOptions().clear();
            return;
        }

        for (com.kyrylo.thesis.course.web.dto.CreateAnswerOptionRequest or : options) {
            AnswerOption option;
            if (allowIds && or.getId() != null) {
                option = existing.get(or.getId());
                if (option == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Варіант не належить питанню");
                }
            } else {
                option = AnswerOption.builder().build();
                option.setQuestion(question);
            }
            option.setText(or.getText().trim());
            option.setCorrect(Boolean.TRUE.equals(or.getCorrect()));
            nextOptions.add(option);
        }

        question.getOptions().clear();
        for (AnswerOption option : nextOptions) {
            question.addOption(option);
        }
    }

    private CourseResponse toResponse(Course course) {
        List<CourseModuleResponse> modules = course.getModules().stream()
                .map(m -> CourseModuleResponse.builder()
                        .id(m.getId())
                        .name(m.getName())
                        .sortOrder(m.getSortOrder())
                        .lessons(m.getLessons().stream()
                                .map(l -> LessonResponse.builder()
                                        .id(l.getId())
                                        .title(l.getTitle())
                                        .content(l.getContent())
                                        .hasQuiz(l.getQuiz() != null)
                                        .quiz(l.getQuiz() == null ? null : QuizResponse.builder()
                                                .id(l.getQuiz().getId())
                                                .title(l.getQuiz().getTitle())
                                                .passingScore(l.getQuiz().getPassingScore())
                                                .lessonId(l.getId())
                                                .questions(l.getQuiz().getQuestions().stream()
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
                                                .build())
                                        .hasPracticalTask(l.getPracticalTask() != null)
                                        .practicalTask(l.getPracticalTask() == null ? null : com.kyrylo.thesis.course.web.dto.PracticalTaskResponse.builder()
                                                .id(l.getPracticalTask().getId())
                                                .title(l.getPracticalTask().getTitle())
                                                .description(l.getPracticalTask().getDescription())
                                                .build())
                                        .build())
                                .toList())
                        .build())
                .toList();

        return CourseResponse.builder()
                .id(course.getId())
                .organizationId(course.getOrganizationId())
                .title(course.getTitle())
                .description(course.getDescription())
                .status(course.getStatus())
                .modules(modules)
                .build();
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }
}
