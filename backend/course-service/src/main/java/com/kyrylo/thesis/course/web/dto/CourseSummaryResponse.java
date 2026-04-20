package com.kyrylo.thesis.course.web.dto;

import com.kyrylo.thesis.course.domain.CourseStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseSummaryResponse {

    private Long id;
    private Long organizationId;
    private String title;
    private CourseStatus status;
}
