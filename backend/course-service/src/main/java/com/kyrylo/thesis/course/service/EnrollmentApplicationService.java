package com.kyrylo.thesis.course.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kyrylo.thesis.course.domain.Course;
import com.kyrylo.thesis.course.domain.CourseStatus;
import com.kyrylo.thesis.course.domain.Enrollment;
import com.kyrylo.thesis.course.domain.EnrollmentStatus;
import com.kyrylo.thesis.course.integration.UserDirectoryClient;
import com.kyrylo.thesis.course.integration.userservice.MeContextDto;
import com.kyrylo.thesis.course.integration.userservice.UserResponseDto;
import com.kyrylo.thesis.course.integration.userservice.UserRole;
import com.kyrylo.thesis.course.repository.CourseRepository;
import com.kyrylo.thesis.course.repository.EnrollmentRepository;
import com.kyrylo.thesis.course.web.dto.CourseProgressResponse;
import com.kyrylo.thesis.course.web.dto.EnrollmentResponse;
import com.kyrylo.thesis.course.web.dto.StudentProgressResponse;

import com.kyrylo.thesis.course.domain.CourseModule;
import com.kyrylo.thesis.course.domain.Lesson;
import com.kyrylo.thesis.course.repository.QuizAttemptRepository;
import com.kyrylo.thesis.course.repository.TaskSubmissionRepository;
import com.kyrylo.thesis.course.domain.TaskSubmissionStatus;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class EnrollmentApplicationService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final UserDirectoryClient userDirectoryClient;
    private final QuizAttemptRepository quizAttemptRepository;
    private final TaskSubmissionRepository taskSubmissionRepository;
    private final SkillApplicationService skillApplicationService;

    /**
     * Самозапис слухача на курс (userId з JWT).
     */
    @Transactional
    public EnrollmentResponse enrollSelf(String authorizationHeader, Long courseId) {
        MeContextDto ctx = userDirectoryClient.fetchMeContext(authorizationHeader);
        if (ctx.getRole() != UserRole.LEARNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Запис на курс доступний лише слухачам");
        }
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Курс не знайдено"));
        
        if (!OrgAccess.learnerOrganizationIds(ctx).contains(course.getOrganizationId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ви не належите до організації цього курсу");
        }
        
        return enroll(ctx.getUserId(), courseId);
    }

    /**
     * Запис слухача викладачем організації курсу.
     */
    @Transactional
    public EnrollmentResponse enrollLearnerByEducator(
            String authorizationHeader,
            Long courseId,
            Long learnerUserId) {
        MeContextDto ctx = userDirectoryClient.fetchMeContext(authorizationHeader);

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Курс не знайдено"));

        if (course.getStatus() != CourseStatus.PUBLISHED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Курс має бути опублікований");
        }

        Long orgId = course.getOrganizationId();
        boolean allowed = OrgAccess.isSuperCurator(ctx)
                || (ctx.getRole() == UserRole.EDUCATOR && OrgAccess.educatorOrganizationIds(ctx).contains(orgId))
                || (ctx.getRole() == UserRole.CURATOR && OrgAccess.curatorOrganizationIds(ctx).contains(orgId));


        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Немає прав записувати на цей курс");
        }

        UserResponseDto learner = userDirectoryClient.fetchUser(learnerUserId, authorizationHeader);
        if (learner.getRole() != UserRole.LEARNER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Користувач має бути слухачем (LEARNER)");
        }

        boolean isInOrg = userDirectoryClient.isLearnerInOrganization(orgId, learnerUserId, authorizationHeader);
        if (!isInOrg) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Слухач не належить до організації цього курсу");
        }

        return enroll(learnerUserId, courseId);
    }

    /**
     * Запис слухача на курс.
     * Курс має бути опублікований; дубль — 409 Conflict.
     */
    @Transactional
    public EnrollmentResponse enroll(Long userId, Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Курс не знайдено"));

        if (course.getStatus() != CourseStatus.PUBLISHED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Запис можливий лише на опублікований курс");
        }

        if (enrollmentRepository.existsByUserIdAndCourseId(userId, courseId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Ви вже записані на цей курс");
        }

        Enrollment enrollment = Enrollment.builder()
                .userId(userId)
                .course(course)
                .status(EnrollmentStatus.ENROLLED)
                .progressPercentage(0)
                .build();

        Enrollment saved = enrollmentRepository.save(enrollment);
        return toResponse(saved);
    }

    /** Усі записи конкретного слухача. */
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getMyEnrollments(Long userId) {
        return enrollmentRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    /** Список студентів курсу з прогресом (куратор / викладач організації). */
    @Transactional(readOnly = true)
    public List<StudentProgressResponse> getStudentsByCourse(String authorizationHeader, Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Курс не знайдено"));

        MeContextDto ctx = userDirectoryClient.fetchMeContext(authorizationHeader);
        Long oid = course.getOrganizationId();

        boolean ok = OrgAccess.isSuperCurator(ctx)
                || (ctx.getRole() == UserRole.EDUCATOR && OrgAccess.educatorOrganizationIds(ctx).contains(oid))
                || (ctx.getRole() == UserRole.CURATOR && OrgAccess.curatorOrganizationIds(ctx).contains(oid));

        if (!ok) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        return enrollmentRepository.findByCourseId(courseId).stream()
                .map(e -> {
                    StudentProgressResponse.StudentProgressResponseBuilder builder = StudentProgressResponse.builder()
                            .enrollmentId(e.getId())
                            .userId(e.getUserId())
                            .status(e.getStatus())
                            .progressPercentage(e.getProgressPercentage());
                    try {
                        UserResponseDto user = userDirectoryClient.fetchUser(e.getUserId(), authorizationHeader);
                        builder.firstName(user.getFirstName())
                               .lastName(user.getLastName())
                               .email(user.getEmail());
                    } catch (Exception ignored) {
                        builder.firstName("—").lastName("").email("");
                    }
                    return builder.build();
                })
                .toList();
    }

    /**
     * Відрахування слухача з курсу (Educator / Curator організації).
     */
    @Transactional
    public void unenrollLearner(String authorizationHeader, Long courseId, Long userId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Курс не знайдено"));

        MeContextDto ctx = userDirectoryClient.fetchMeContext(authorizationHeader);
        Long oid = course.getOrganizationId();

        boolean ok = OrgAccess.isSuperCurator(ctx)
                || (ctx.getRole() == UserRole.EDUCATOR && OrgAccess.educatorOrganizationIds(ctx).contains(oid))
                || (ctx.getRole() == UserRole.CURATOR && OrgAccess.curatorOrganizationIds(ctx).contains(oid));

        if (!ok) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Немає прав на відрахування");
        }

        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Слухач не записаний на цей курс"));

        enrollmentRepository.delete(enrollment);
    }

    private EnrollmentResponse toResponse(Enrollment e) {
        return EnrollmentResponse.builder()
                .id(e.getId())
                .userId(e.getUserId())
                .courseId(e.getCourse().getId())
                .courseTitle(e.getCourse().getTitle())
                .status(e.getStatus())
                .progressPercentage(e.getProgressPercentage())
                .build();
    }

    /**
     * Перерахувати прогрес проходження курсу на основі пройдених квізів та практичних завдань.
     * Якщо всі завдання пройдені — enrollment.status = COMPLETED + нарахування навичок.
     */
    @Transactional
    public void recalculateProgress(Long userId, Course course) {
        int totalAssessments = 0;
        int passedAssessments = 0;

        for (CourseModule module : course.getModules()) {
            for (Lesson lesson : module.getLessons()) {
                if (lesson.getQuiz() != null) {
                    totalAssessments++;
                    var lastAttempt = quizAttemptRepository
                            .findTopByUserIdAndQuizIdOrderByAttemptedAtDesc(userId, lesson.getQuiz().getId());
                    if (lastAttempt.isPresent() && Boolean.TRUE.equals(lastAttempt.get().getPassed())) {
                        passedAssessments++;
                    }
                }
                if (lesson.getPracticalTask() != null) {
                    totalAssessments++;
                    var submission = taskSubmissionRepository
                            .findTopByUserIdAndPracticalTaskIdOrderBySubmittedAtDesc(userId, lesson.getPracticalTask().getId());
                    if (submission.isPresent() && submission.get().getStatus() == TaskSubmissionStatus.APPROVED) {
                        passedAssessments++;
                    }
                }
            }
        }

        if (totalAssessments == 0) {
            return;
        }

        int progress = Math.round((float) passedAssessments / totalAssessments * 100);

        enrollmentRepository.findByUserIdAndCourseId(userId, course.getId()).ifPresent(enrollment -> {
            enrollment.setProgressPercentage(progress);
            if (progress >= 100 && enrollment.getStatus() != EnrollmentStatus.COMPLETED) {
                enrollment.setStatus(EnrollmentStatus.COMPLETED);
                skillApplicationService.awardSkillsForCompletedCourse(userId, course.getId());
            }
            enrollmentRepository.save(enrollment);
        });
    }

    /**
     * Отримати детальний прогрес слухача по курсу:
     * загальний відсоток + статус кожного уроку (тест / завдання).
     */
    @Transactional(readOnly = true)
    public CourseProgressResponse getCourseProgress(Long userId, Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Курс не знайдено"));

        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ви не записані на цей курс"));

        List<CourseProgressResponse.LessonProgress> lessonProgresses = new ArrayList<>();

        for (CourseModule module : course.getModules()) {
            for (Lesson lesson : module.getLessons()) {
                boolean hasQuiz = lesson.getQuiz() != null;
                Boolean quizPassed = null;
                boolean hasTask = lesson.getPracticalTask() != null;
                TaskSubmissionStatus taskStatus = null;

                if (hasQuiz) {
                    var lastAttempt = quizAttemptRepository
                            .findTopByUserIdAndQuizIdOrderByAttemptedAtDesc(userId, lesson.getQuiz().getId());
                    quizPassed = lastAttempt.map(a -> Boolean.TRUE.equals(a.getPassed())).orElse(false);
                }

                if (hasTask) {
                    var submission = taskSubmissionRepository
                            .findTopByUserIdAndPracticalTaskIdOrderBySubmittedAtDesc(userId, lesson.getPracticalTask().getId());
                    taskStatus = submission.map(s -> s.getStatus()).orElse(null);
                }

                boolean completed = true;
                if (hasQuiz && !Boolean.TRUE.equals(quizPassed)) {
                    completed = false;
                }
                if (hasTask && (taskStatus == null || taskStatus == TaskSubmissionStatus.NEEDS_WORK)) {
                    completed = false;
                }

                lessonProgresses.add(CourseProgressResponse.LessonProgress.builder()
                        .lessonId(lesson.getId())
                        .hasQuiz(hasQuiz)
                        .quizPassed(quizPassed)
                        .hasPracticalTask(hasTask)
                        .taskStatus(taskStatus)
                        .completed(completed)
                        .build());
            }
        }

        return CourseProgressResponse.builder()
                .enrollmentStatus(enrollment.getStatus())
                .progressPercentage(enrollment.getProgressPercentage())
                .lessonProgresses(lessonProgresses)
                .build();
    }
}
