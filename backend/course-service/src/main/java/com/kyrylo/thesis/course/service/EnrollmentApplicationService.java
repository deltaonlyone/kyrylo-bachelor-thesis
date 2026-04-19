package com.kyrylo.thesis.course.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kyrylo.thesis.course.domain.Course;
import com.kyrylo.thesis.course.domain.CourseStatus;
import com.kyrylo.thesis.course.domain.Enrollment;
import com.kyrylo.thesis.course.domain.EnrollmentStatus;
import com.kyrylo.thesis.course.repository.CourseRepository;
import com.kyrylo.thesis.course.repository.EnrollmentRepository;
import com.kyrylo.thesis.course.web.dto.EnrollmentResponse;
import com.kyrylo.thesis.course.web.dto.StudentProgressResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EnrollmentApplicationService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;

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

    /** Список студентів курсу з прогресом (для Educator). */
    @Transactional(readOnly = true)
    public List<StudentProgressResponse> getStudentsByCourse(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Курс не знайдено");
        }
        return enrollmentRepository.findByCourseId(courseId).stream()
                .map(e -> StudentProgressResponse.builder()
                        .enrollmentId(e.getId())
                        .userId(e.getUserId())
                        .status(e.getStatus())
                        .progressPercentage(e.getProgressPercentage())
                        .build())
                .toList();
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
}
