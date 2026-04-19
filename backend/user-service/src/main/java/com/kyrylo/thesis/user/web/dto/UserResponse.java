package com.kyrylo.thesis.user.web.dto;

import com.kyrylo.thesis.user.domain.UserRole;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserResponse {

    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private UserRole role;
}
