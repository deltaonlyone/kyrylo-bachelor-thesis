package com.kyrylo.thesis.course.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kyrylo.thesis.course.domain.TaskSubmission;
import com.kyrylo.thesis.course.domain.TaskSubmissionStatus;

public interface TaskSubmissionRepository extends JpaRepository<TaskSubmission, Long> {
    
    List<TaskSubmission> findByUserIdAndPracticalTaskId(Long userId, Long practicalTaskId);
    
    Optional<TaskSubmission> findTopByUserIdAndPracticalTaskIdOrderBySubmittedAtDesc(Long userId, Long practicalTaskId);

    @Query("SELECT ts FROM TaskSubmission ts JOIN FETCH ts.practicalTask pt JOIN FETCH pt.lesson l JOIN FETCH l.module m JOIN FETCH m.course c WHERE ts.status = :status ORDER BY ts.submittedAt ASC")
    List<TaskSubmission> findAllByStatusWithTask(@Param("status") TaskSubmissionStatus status);
}
