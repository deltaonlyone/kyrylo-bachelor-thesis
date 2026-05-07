package com.kyrylo.thesis.course.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.kyrylo.thesis.course.domain.CourseSkill;

public interface CourseSkillRepository extends JpaRepository<CourseSkill, Long> {

    @Query("SELECT cs FROM CourseSkill cs JOIN FETCH cs.skill WHERE cs.course.id = :courseId")
    List<CourseSkill> findByCourseIdWithSkill(Long courseId);

    void deleteByCourseId(Long courseId);
}
