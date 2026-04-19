package com.kyrylo.thesis.course.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kyrylo.thesis.course.domain.Enrollment;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    /** Перевірка, чи вже записаний слухач на курс. */
    boolean existsByUserIdAndCourseId(Long userId, Long courseId);

    /** Пошук запису конкретного слухача на курс. */
    Optional<Enrollment> findByUserIdAndCourseId(Long userId, Long courseId);

    /** Усі записи на конкретний курс (для списку студентів). */
    List<Enrollment> findByCourseId(Long courseId);

    /** Усі записи конкретного слухача (для його дашборду). */
    List<Enrollment> findByUserId(Long userId);
}
