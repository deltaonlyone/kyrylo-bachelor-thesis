package com.kyrylo.thesis.course.web.dto;

import com.kyrylo.thesis.course.domain.EnrollmentStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentResponse {

    private Long id;
    private Long userId;
    private Long courseId;
    private String courseTitle;
    private EnrollmentStatus status;
    private Integer progressPercentage;
}
