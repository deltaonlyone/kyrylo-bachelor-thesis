package com.kyrylo.thesis.course.service;

import java.util.Set;
import java.util.stream.Collectors;

import com.kyrylo.thesis.course.integration.userservice.CuratorGlobalRole;
import com.kyrylo.thesis.course.integration.userservice.MeContextDto;
import com.kyrylo.thesis.course.integration.userservice.OrganizationContextDto;
import com.kyrylo.thesis.course.integration.userservice.OrganizationMemberKind;
import com.kyrylo.thesis.course.integration.userservice.UserRole;

public final class OrgAccess {

    private OrgAccess() {
    }

    public static boolean isSuperCurator(MeContextDto ctx) {
        return ctx.isSuperAdmin()
                || (ctx.getRole() == UserRole.CURATOR
                        && ctx.getCuratorGlobalRole() == CuratorGlobalRole.SUPER_ADMIN);
    }

    public static Set<Long> curatorOrganizationIds(MeContextDto ctx) {
        if (ctx.getOrganizations() == null) {
            return Set.of();
        }
        return ctx.getOrganizations().stream()
                .filter(o -> o.getMemberKind() == OrganizationMemberKind.CURATOR)
                .map(OrganizationContextDto::getOrganizationId)
                .collect(Collectors.toSet());
    }

    public static Set<Long> educatorOrganizationIds(MeContextDto ctx) {
        if (ctx.getOrganizations() == null) {
            return Set.of();
        }
        return ctx.getOrganizations().stream()
                .filter(o -> o.getMemberKind() == OrganizationMemberKind.EDUCATOR)
                .map(OrganizationContextDto::getOrganizationId)
                .collect(Collectors.toSet());
    }
}
