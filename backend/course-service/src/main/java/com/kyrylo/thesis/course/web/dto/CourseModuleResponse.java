package com.kyrylo.thesis.course.web.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseModuleResponse {

    private Long id;
    private String name;
    private Integer sortOrder;
    private List<LessonResponse> lessons;
}
