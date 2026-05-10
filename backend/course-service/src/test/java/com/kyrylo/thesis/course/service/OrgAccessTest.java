package com.kyrylo.thesis.course.service;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.kyrylo.thesis.course.integration.userservice.CuratorGlobalRole;
import com.kyrylo.thesis.course.integration.userservice.MeContextDto;
import com.kyrylo.thesis.course.integration.userservice.OrganizationContextDto;
import com.kyrylo.thesis.course.integration.userservice.OrganizationMemberKind;
import com.kyrylo.thesis.course.integration.userservice.UserRole;

class OrgAccessTest {

    private static MeContextDto ctx(UserRole role, boolean superAdmin, OrganizationMemberKind kind, Long orgId) {
        MeContextDto ctx = new MeContextDto();
        ctx.setRole(role);
        ctx.setSuperAdmin(superAdmin);
        if (orgId != null) {
            OrganizationContextDto o = new OrganizationContextDto();
            o.setOrganizationId(orgId);
            o.setMemberKind(kind);
            ctx.setOrganizations(List.of(o));
        }
        return ctx;
    }

    @Test
    void isSuperCurator_whenSuperAdminFlag() {
        MeContextDto ctx = new MeContextDto();
        ctx.setSuperAdmin(true);
        assertTrue(OrgAccess.isSuperCurator(ctx));
    }

    @Test
    void isSuperCurator_whenCuratorGlobalRoleSuperAdmin() {
        MeContextDto ctx = new MeContextDto();
        ctx.setRole(UserRole.CURATOR);
        ctx.setCuratorGlobalRole(CuratorGlobalRole.SUPER_ADMIN);
        assertTrue(OrgAccess.isSuperCurator(ctx));
    }

    @Test
    void isSuperCurator_false_forRegularCurator() {
        MeContextDto ctx = new MeContextDto();
        ctx.setRole(UserRole.CURATOR);
        ctx.setCuratorGlobalRole(CuratorGlobalRole.NONE);
        assertFalse(OrgAccess.isSuperCurator(ctx));
    }

    @Test
    void curatorOrganizationIds_returnsOnlyCuratorOrgs() {
        MeContextDto ctx = ctx(UserRole.CURATOR, false, OrganizationMemberKind.CURATOR, 10L);
        assertTrue(OrgAccess.curatorOrganizationIds(ctx).contains(10L));
        assertTrue(OrgAccess.educatorOrganizationIds(ctx).isEmpty());
    }

    @Test
    void educatorOrganizationIds_returnsOnlyEducatorOrgs() {
        MeContextDto ctx = ctx(UserRole.EDUCATOR, false, OrganizationMemberKind.EDUCATOR, 20L);
        assertTrue(OrgAccess.educatorOrganizationIds(ctx).contains(20L));
        assertTrue(OrgAccess.curatorOrganizationIds(ctx).isEmpty());
    }

    @Test
    void learnerOrganizationIds_returnsOnlyLearnerOrgs() {
        MeContextDto ctx = ctx(UserRole.LEARNER, false, OrganizationMemberKind.LEARNER, 30L);
        assertTrue(OrgAccess.learnerOrganizationIds(ctx).contains(30L));
    }

    @Test
    void allIds_emptyWhenOrganizationsNull() {
        MeContextDto ctx = new MeContextDto();
        assertTrue(OrgAccess.curatorOrganizationIds(ctx).isEmpty());
        assertTrue(OrgAccess.educatorOrganizationIds(ctx).isEmpty());
        assertTrue(OrgAccess.learnerOrganizationIds(ctx).isEmpty());
    }
}
