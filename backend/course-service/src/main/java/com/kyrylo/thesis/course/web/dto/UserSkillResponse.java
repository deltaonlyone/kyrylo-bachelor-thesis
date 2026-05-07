package com.kyrylo.thesis.course.web.dto;

import java.time.Instant;

import com.kyrylo.thesis.course.domain.SkillCategory;
import com.kyrylo.thesis.course.domain.SkillLevel;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Набута навичка працівника з інформацією про курс-джерело.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSkillResponse {

    private Long skillId;
    private String skillName;
    private SkillCategory category;
    private SkillLevel skillLevel;
    private Instant acquiredAt;
    private Long courseId;
    private String courseTitle;
}
