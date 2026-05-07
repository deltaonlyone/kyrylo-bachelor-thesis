package com.kyrylo.thesis.course.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.kyrylo.thesis.course.domain.UserSkill;

public interface UserSkillRepository extends JpaRepository<UserSkill, Long> {

    @Query("SELECT us FROM UserSkill us JOIN FETCH us.skill JOIN FETCH us.course WHERE us.userId = :userId")
    List<UserSkill> findByUserIdWithDetails(Long userId);

    Optional<UserSkill> findByUserIdAndSkillId(Long userId, Long skillId);
}
