package com.kyrylo.thesis.course.web.dto;

import java.util.ArrayList;
import java.util.List;

import com.kyrylo.thesis.course.domain.CourseStatus;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateCourseRequest {

    @NotBlank
    private String title;

    private String description;

    @NotNull
    private CourseStatus status;

    @NotNull
    @Valid
    private List<CreateModuleRequest> modules = new ArrayList<>();
}
