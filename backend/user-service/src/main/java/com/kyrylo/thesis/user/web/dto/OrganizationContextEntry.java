package com.kyrylo.thesis.user.web.dto;

import com.kyrylo.thesis.user.domain.CuratorOrgRole;
import com.kyrylo.thesis.user.domain.OrganizationMemberKind;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrganizationContextEntry {

    private Long organizationId;
    private String organizationName;
    /** Членство в орг.; null якщо супер-адмін бачить орг. без власного запису. */
    private OrganizationMemberKind memberKind;
    private CuratorOrgRole curatorOrgRole;
}
