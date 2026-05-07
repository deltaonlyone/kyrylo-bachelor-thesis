package com.kyrylo.thesis.course.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.Valid;
import lombok.Data;

@Data
public class CreateLessonRequest {

    private Long id; // optional (for update)

    @NotBlank
    private String title;

    @NotBlank
    private String content;

    // Вкладені сутності (опціонально)
    @Valid
    private CreateQuizRequest quiz;
    
    @Valid
    private CreatePracticalTaskRequest practicalTask;
}
