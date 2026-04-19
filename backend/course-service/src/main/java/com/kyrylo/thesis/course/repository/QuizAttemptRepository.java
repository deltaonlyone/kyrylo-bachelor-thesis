package com.kyrylo.thesis.course.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kyrylo.thesis.course.domain.QuizAttempt;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    /** Останній результат слухача для квізу (найновіша спроба). */
    Optional<QuizAttempt> findTopByUserIdAndQuizIdOrderByAttemptedAtDesc(Long userId, Long quizId);
}
