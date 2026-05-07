package com.kyrylo.thesis.course.web.dto;

import com.kyrylo.thesis.course.domain.EnrollmentStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Інформація про слухача та його прогрес по курсу
 * (для кабінету Educator).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentProgressResponse {

    private Long enrollmentId;
    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private EnrollmentStatus status;
    private Integer progressPercentage;
}
