package com.kyrylo.thesis.course.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kyrylo.thesis.course.domain.PracticalTask;

public interface PracticalTaskRepository extends JpaRepository<PracticalTask, Long> {
}
