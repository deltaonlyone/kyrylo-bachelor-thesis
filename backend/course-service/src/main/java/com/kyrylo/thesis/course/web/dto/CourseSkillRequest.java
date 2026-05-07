package com.kyrylo.thesis.course.web.dto;

import com.kyrylo.thesis.course.domain.SkillLevel;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CourseSkillRequest {

    @NotNull
    private Long skillId;

    @NotNull
    private SkillLevel skillLevel;
}
