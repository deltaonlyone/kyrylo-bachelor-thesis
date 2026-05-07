package com.kyrylo.thesis.course.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kyrylo.thesis.course.domain.Skill;
import com.kyrylo.thesis.course.domain.SkillCategory;

public interface SkillRepository extends JpaRepository<Skill, Long> {

    Optional<Skill> findByNameIgnoreCase(String name);

    List<Skill> findAllByOrderByNameAsc();

    List<Skill> findByCategory(SkillCategory category);
}
