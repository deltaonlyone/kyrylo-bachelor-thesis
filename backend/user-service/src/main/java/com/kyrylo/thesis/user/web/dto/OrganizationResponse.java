package com.kyrylo.thesis.user.web.dto;

import java.time.Instant;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrganizationResponse {

    private Long id;
    private String name;
    private Instant createdAt;
}
