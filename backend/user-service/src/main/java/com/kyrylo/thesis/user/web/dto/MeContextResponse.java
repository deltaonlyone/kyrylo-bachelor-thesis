package com.kyrylo.thesis.user.web.dto;

import java.util.List;

import com.kyrylo.thesis.user.domain.CuratorGlobalRole;
import com.kyrylo.thesis.user.domain.UserRole;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MeContextResponse {

    private Long userId;
    private String email;
    private String firstName;
    private String lastName;
    private UserRole role;
    private CuratorGlobalRole curatorGlobalRole;
    /** true якщо куратор із глобальною роллю SUPER_ADMIN. */
    private boolean superAdmin;
    private List<OrganizationContextEntry> organizations;
}
