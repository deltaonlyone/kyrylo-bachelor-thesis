package com.kyrylo.thesis.course.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.kyrylo.thesis.course.service.EnrollmentApplicationService;
import com.kyrylo.thesis.course.web.dto.EnrollmentResponse;
import com.kyrylo.thesis.course.web.dto.StudentProgressResponse;

import lombok.RequiredArgsConstructor;

/**
 * Ендпоінти для записів на курс (Enrollment).
 * <p>
 * userId передається у заголовку X-User-Id, який Gateway або
 * JwtFilter проставляє після валідації JWT (stateless між сервісами).
 */
@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentApplicationService enrollmentService;

    /**
     * POST /api/enrollments/{courseId} — Learner записується на курс.
     * userId береться з заголовка X-User-Id.
     */
    @PostMapping("/{courseId}")
    @ResponseStatus(HttpStatus.CREATED)
    public EnrollmentResponse enroll(
            @PathVariable Long courseId,
            @RequestHeader("X-User-Id") Long userId) {
        return enrollmentService.enroll(userId, courseId);
    }

    /**
     * GET /api/enrollments/my — усі записи поточного слухача.
     */
    @GetMapping("/my")
    public List<EnrollmentResponse> myEnrollments(
            @RequestHeader("X-User-Id") Long userId) {
        return enrollmentService.getMyEnrollments(userId);
    }

    /**
     * GET /api/enrollments/students/{courseId} — список студентів курсу
     * та їхній прогрес (для Educator).
     */
    @GetMapping("/students/{courseId}")
    public List<StudentProgressResponse> getStudents(@PathVariable Long courseId) {
        return enrollmentService.getStudentsByCourse(courseId);
    }
}
