package com.kyrylo.thesis.user.web.dto;

import com.kyrylo.thesis.user.domain.CuratorOrgRole;
import com.kyrylo.thesis.user.domain.OrganizationMemberKind;
import com.kyrylo.thesis.user.domain.UserRole;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrganizationMemberResponse {

    private Long userId;
    private String email;
    private String firstName;
    private String lastName;
    private UserRole globalRole;
    private OrganizationMemberKind memberKind;
    private CuratorOrgRole curatorOrgRole;
}
