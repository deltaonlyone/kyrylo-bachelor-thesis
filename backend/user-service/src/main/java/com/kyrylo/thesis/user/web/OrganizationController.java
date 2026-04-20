package com.kyrylo.thesis.user.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.kyrylo.thesis.user.security.SecurityUserPrincipal;
import com.kyrylo.thesis.user.service.OrganizationApplicationService;
import com.kyrylo.thesis.user.web.dto.AddOrgMemberByIdRequest;
import com.kyrylo.thesis.user.web.dto.CreateOrganizationRequest;
import com.kyrylo.thesis.user.web.dto.InviteCuratorRequest;
import com.kyrylo.thesis.user.web.dto.OrganizationMemberResponse;
import com.kyrylo.thesis.user.web.dto.OrganizationResponse;
import com.kyrylo.thesis.user.web.dto.RenameOrganizationRequest;
import com.kyrylo.thesis.user.web.dto.UpdateCuratorOrgRoleRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationApplicationService organizationApplicationService;

    @GetMapping
    public List<OrganizationResponse> list(@AuthenticationPrincipal SecurityUserPrincipal principal) {
        return organizationApplicationService.listOrganizations(principal);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrganizationResponse create(
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @Valid @RequestBody CreateOrganizationRequest request) {
        return organizationApplicationService.createOrganization(principal, request);
    }

    @PatchMapping("/{organizationId}")
    public OrganizationResponse rename(
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @PathVariable Long organizationId,
            @Valid @RequestBody RenameOrganizationRequest request) {
        return organizationApplicationService.renameOrganization(principal, organizationId, request);
    }

    @GetMapping("/{organizationId}/members")
    public List<OrganizationMemberResponse> listMembers(
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @PathVariable Long organizationId) {
        return organizationApplicationService.listMembers(principal, organizationId);
    }

    @PostMapping("/{organizationId}/curators/invite")
    @ResponseStatus(HttpStatus.CREATED)
    public OrganizationMemberResponse inviteCurator(
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @PathVariable Long organizationId,
            @Valid @RequestBody InviteCuratorRequest request) {
        return organizationApplicationService.inviteCurator(principal, organizationId, request);
    }

    @PostMapping("/{organizationId}/educators")
    @ResponseStatus(HttpStatus.CREATED)
    public void addEducator(
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @PathVariable Long organizationId,
            @Valid @RequestBody AddOrgMemberByIdRequest body) {
        organizationApplicationService.addEducator(principal, organizationId, body);
    }

    @PostMapping("/{organizationId}/members/learners")
    @ResponseStatus(HttpStatus.CREATED)
    public void addLearner(
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @PathVariable Long organizationId,
            @Valid @RequestBody AddOrgMemberByIdRequest body) {
        organizationApplicationService.addLearner(principal, organizationId, body);
    }

    @PatchMapping("/{organizationId}/members/{userId}/curator-role")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateCuratorOrgRole(
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @PathVariable Long organizationId,
            @PathVariable Long userId,
            @Valid @RequestBody UpdateCuratorOrgRoleRequest request) {
        organizationApplicationService.updateCuratorOrgRole(principal, organizationId, userId, request);
    }
}
