package com.kyrylo.thesis.user.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.kyrylo.thesis.user.domain.UserRole;
import com.kyrylo.thesis.user.service.UserApplicationService;
import com.kyrylo.thesis.user.web.dto.CreateUserRequest;
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
    public UserResponse createUser(@Valid @RequestBody CreateUserRequest request) {
        return userApplicationService.createUser(request);
    }

    @GetMapping
    public List<UserResponse> listUsersByRole(@RequestParam("role") UserRole role) {
        return userApplicationService.findByRole(role);
    }
}
