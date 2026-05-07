package com.kyrylo.thesis.user.web.dto;

import com.kyrylo.thesis.user.domain.CuratorGlobalRole;
import com.kyrylo.thesis.user.domain.UserRole;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateUserRequest {
    @NotBlank(message = "Email не може бути порожнім")
    @Email(message = "Некоректний формат email")
    private String email;

    @NotBlank(message = "Ім'я не може бути порожнім")
    private String firstName;

    @NotBlank(message = "Прізвище не може бути порожнім")
    private String lastName;

    @NotNull(message = "Роль обов'язкова")
    private UserRole role;

    private CuratorGlobalRole curatorGlobalRole;

    private String password;
}
