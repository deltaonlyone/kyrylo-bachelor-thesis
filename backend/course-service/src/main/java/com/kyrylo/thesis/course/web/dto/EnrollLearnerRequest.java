package com.kyrylo.thesis.course.web.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EnrollLearnerRequest {

    @NotNull
    private Long learnerUserId;
}
