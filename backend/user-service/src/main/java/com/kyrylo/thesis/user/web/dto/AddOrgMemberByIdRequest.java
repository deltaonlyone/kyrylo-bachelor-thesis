package com.kyrylo.thesis.user.web.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddOrgMemberByIdRequest {

    @NotNull
    private Long userId;
}
