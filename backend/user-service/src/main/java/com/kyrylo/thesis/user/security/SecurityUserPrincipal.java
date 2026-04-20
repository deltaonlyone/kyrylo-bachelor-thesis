package com.kyrylo.thesis.user.security;

import com.kyrylo.thesis.user.domain.CuratorGlobalRole;
import com.kyrylo.thesis.user.domain.UserRole;

/** Principal після успішної JWT-автентифікації. */
public record SecurityUserPrincipal(
        Long userId,
        UserRole role,
        CuratorGlobalRole curatorGlobalRole
) {
    public boolean isSuperAdminCurator() {
        return role == UserRole.CURATOR && curatorGlobalRole == CuratorGlobalRole.SUPER_ADMIN;
    }
}
