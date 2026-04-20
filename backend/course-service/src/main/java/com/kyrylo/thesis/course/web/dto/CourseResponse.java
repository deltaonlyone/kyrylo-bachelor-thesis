package com.kyrylo.thesis.course.web.dto;

import java.util.List;

import com.kyrylo.thesis.course.domain.CourseStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponse {

    private Long id;
    private Long organizationId;
    private String title;
    private String description;
    private CourseStatus status;
    private List<CourseModuleResponse> modules;
}
