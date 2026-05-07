package com.kyrylo.thesis.course.web.dto;

import com.kyrylo.thesis.course.domain.SkillCategory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillResponse {

    private Long id;
    private String name;
    private SkillCategory category;
}
