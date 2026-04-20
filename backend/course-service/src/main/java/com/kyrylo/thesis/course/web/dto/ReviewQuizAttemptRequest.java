package com.kyrylo.thesis.course.web.dto;

import java.util.ArrayList;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReviewQuizAttemptRequest {

    @NotEmpty
    @Valid
    private List<ItemReview> reviews = new ArrayList<>();

    @Data
    public static class ItemReview {
        @NotNull
        private Long itemId;
        @NotNull
        private Integer manualPoints;
    }
}
