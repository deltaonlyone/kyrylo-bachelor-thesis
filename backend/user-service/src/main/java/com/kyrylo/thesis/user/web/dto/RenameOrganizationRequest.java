package com.kyrylo.thesis.user.web.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RenameOrganizationRequest {

    @NotBlank
    private String name;
}
