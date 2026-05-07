package com.kyrylo.thesis.course.web.dto;

import com.kyrylo.thesis.course.domain.SkillCategory;
import com.kyrylo.thesis.course.domain.SkillLevel;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseSkillResponse {

    private Long skillId;
    private String skillName;
    private SkillCategory category;
    private SkillLevel skillLevel;
}
