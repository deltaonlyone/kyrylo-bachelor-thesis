package com.kyrylo.thesis.course.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kyrylo.thesis.course.domain.Course;
import com.kyrylo.thesis.course.domain.CourseStatus;

public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findByOrganizationIdIn(Collection<Long> organizationIds);

    List<Course> findByStatus(CourseStatus status);

    List<Course> findByOrganizationIdInAndStatus(Collection<Long> organizationIds, CourseStatus status);

    @Query("""
            SELECT c FROM Course c
            LEFT JOIN FETCH c.modules m
            WHERE c.id = :id
            """)
    Optional<Course> findByIdWithStructure(@Param("id") Long id);
}
