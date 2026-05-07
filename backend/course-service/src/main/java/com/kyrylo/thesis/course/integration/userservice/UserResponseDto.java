package com.kyrylo.thesis.course.integration.userservice;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserResponseDto {

    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private UserRole role;
}
