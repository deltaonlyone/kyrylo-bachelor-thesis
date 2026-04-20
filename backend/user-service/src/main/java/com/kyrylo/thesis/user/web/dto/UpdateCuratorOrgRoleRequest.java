package com.kyrylo.thesis.user.web.dto;

import com.kyrylo.thesis.user.domain.CuratorOrgRole;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateCuratorOrgRoleRequest {

    @NotNull
    private CuratorOrgRole curatorOrgRole;
}
