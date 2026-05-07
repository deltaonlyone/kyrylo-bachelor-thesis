package com.kyrylo.thesis.user.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.kyrylo.thesis.user.domain.UserRole;
import com.kyrylo.thesis.user.security.SecurityUserPrincipal;
import com.kyrylo.thesis.user.service.UserApplicationService;
import com.kyrylo.thesis.user.web.dto.CreateUserRequest;
import com.kyrylo.thesis.user.web.dto.UpdateUserRequest;
import com.kyrylo.thesis.user.web.dto.UserResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserApplicationService userApplicationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createUser(
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @Valid @RequestBody CreateUserRequest request) {
        return userApplicationService.createUserAsSuperAdmin(principal.userId(), request);
    }

    @GetMapping
    public List<UserResponse> listUsersByRole(
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @RequestParam("role") UserRole role) {
        return userApplicationService.findByRoleForActor(principal, role);
    }

    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable Long id) {
        return userApplicationService.findById(id);
    }

    @PutMapping("/{id}")
    public UserResponse updateUser(
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        return userApplicationService.updateUserAsSuperAdmin(principal.userId(), id, request);
    }
}
