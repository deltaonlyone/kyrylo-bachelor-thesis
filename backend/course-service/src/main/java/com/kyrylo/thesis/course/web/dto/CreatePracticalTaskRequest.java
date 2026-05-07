package com.kyrylo.thesis.course.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePracticalTaskRequest {
    private Long id;
    private String title;
    private String description;
}
