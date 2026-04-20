package com.kyrylo.thesis.course.integration.userservice;

import lombok.Data;

@Data
public class OrganizationContextDto {

    private Long organizationId;
    private String organizationName;
    private OrganizationMemberKind memberKind;
    private CuratorOrgRole curatorOrgRole;
}
