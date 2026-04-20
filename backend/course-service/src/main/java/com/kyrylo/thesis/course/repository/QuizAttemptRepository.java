package com.kyrylo.thesis.course.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kyrylo.thesis.course.domain.QuizAttempt;
import com.kyrylo.thesis.course.domain.QuizAttemptStatus;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    /** Останній результат слухача для квізу (найновіша спроба). */
    Optional<QuizAttempt> findTopByUserIdAndQuizIdOrderByAttemptedAtDesc(Long userId, Long quizId);

    @Query("""
            SELECT DISTINCT qa FROM QuizAttempt qa
            LEFT JOIN FETCH qa.items i
            LEFT JOIN FETCH i.question q
            LEFT JOIN FETCH qa.quiz quiz
            LEFT JOIN FETCH quiz.lesson lesson
            LEFT JOIN FETCH lesson.module module
            LEFT JOIN FETCH module.course course
            WHERE qa.status = :status
            ORDER BY qa.attemptedAt DESC
            """)
    List<QuizAttempt> findAllByStatusWithItems(@Param("status") QuizAttemptStatus status);

    @Query("""
            SELECT qa FROM QuizAttempt qa
            JOIN FETCH qa.quiz q
            JOIN FETCH q.lesson l
            JOIN FETCH l.module m
            JOIN FETCH m.course c
            LEFT JOIN FETCH qa.items i
            LEFT JOIN FETCH i.question iq
            WHERE qa.id = :id
            """)
    Optional<QuizAttempt> findByIdWithDetail(@Param("id") Long id);
}
