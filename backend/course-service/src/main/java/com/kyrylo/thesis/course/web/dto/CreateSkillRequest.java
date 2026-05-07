package com.kyrylo.thesis.course.web.dto;

import com.kyrylo.thesis.course.domain.SkillCategory;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateSkillRequest {

    @NotBlank
    private String name;

    @NotNull
    private SkillCategory category;
}
