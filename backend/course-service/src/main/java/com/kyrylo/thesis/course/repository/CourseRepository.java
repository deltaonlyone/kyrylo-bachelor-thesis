package com.kyrylo.thesis.course.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kyrylo.thesis.course.domain.Course;

public interface CourseRepository extends JpaRepository<Course, Long> {

    @Query("""
            SELECT DISTINCT c FROM Course c
            LEFT JOIN FETCH c.modules m
            LEFT JOIN FETCH m.lessons
            WHERE c.id = :id
            """)
    Optional<Course> findByIdWithStructure(@Param("id") Long id);
}
