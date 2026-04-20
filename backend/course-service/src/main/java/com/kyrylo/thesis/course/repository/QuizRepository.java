package com.kyrylo.thesis.course.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kyrylo.thesis.course.domain.Quiz;

public interface QuizRepository extends JpaRepository<Quiz, Long> {

    /** Перевірка, чи існує квіз для уроку. */
    boolean existsByLessonId(Long lessonId);

    /** Завантаження квізу з питаннями та варіантами відповідей. */
    @Query("""
            SELECT DISTINCT q FROM Quiz q
            JOIN FETCH q.lesson l
            JOIN FETCH l.module m
            JOIN FETCH m.course c
            LEFT JOIN FETCH q.questions quest
            WHERE l.id = :lessonId
            """)
    Optional<Quiz> findByLessonIdWithQuestions(@Param("lessonId") Long lessonId);

    Optional<Quiz> findByLessonId(Long lessonId);
}
