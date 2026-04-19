package com.kyrylo.thesis.course.web.dto;

import java.util.ArrayList;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateModuleRequest {

    @NotBlank
    private String name;

    @NotNull
    private Integer sortOrder;

    @NotNull
    @Valid
    private List<CreateLessonRequest> lessons = new ArrayList<>();
}
