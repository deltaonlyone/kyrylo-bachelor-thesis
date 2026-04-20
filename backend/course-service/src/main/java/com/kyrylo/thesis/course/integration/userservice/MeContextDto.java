package com.kyrylo.thesis.course.integration.userservice;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MeContextDto {

    private Long userId;
    private String email;
    private UserRole role;
    private CuratorGlobalRole curatorGlobalRole;
    private boolean superAdmin;
    private List<OrganizationContextDto> organizations;
}
