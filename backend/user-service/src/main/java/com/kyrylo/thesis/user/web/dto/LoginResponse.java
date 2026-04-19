package com.kyrylo.thesis.user.web.dto;

import com.kyrylo.thesis.user.domain.UserRole;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponse {

    private String token;
    private Long userId;
    private String email;
    private String firstName;
    private String lastName;
    private UserRole role;
}
