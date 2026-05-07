package com.kyrylo.thesis.user.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kyrylo.thesis.user.domain.CuratorGlobalRole;
import com.kyrylo.thesis.user.domain.User;
import com.kyrylo.thesis.user.domain.UserRole;
import com.kyrylo.thesis.user.repository.UserRepository;
import com.kyrylo.thesis.user.security.SecurityUserPrincipal;
import com.kyrylo.thesis.user.web.dto.CreateUserRequest;
import com.kyrylo.thesis.user.web.dto.UpdateUserRequest;
import com.kyrylo.thesis.user.web.dto.UserResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class UserApplicationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        CuratorGlobalRole cgr = CuratorGlobalRole.NONE;
        if (request.getRole() == UserRole.CURATOR && request.getCuratorGlobalRole() != null) {
            cgr = request.getCuratorGlobalRole();
        }
        User user = User.builder()
                .email(request.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .role(request.getRole())
                .curatorGlobalRole(cgr)
                .build();
        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return toResponse(user);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> findByRole(UserRole role) {
        return userRepository.findByRole(role).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public UserResponse createUserAsSuperAdmin(Long actorUserId, CreateUserRequest request) {
        User actor = userRepository.findById(actorUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (actor.getRole() != UserRole.CURATOR
                || actor.getCuratorGlobalRole() != CuratorGlobalRole.SUPER_ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Створення користувачів — лише для супер-адміна");
        }
        return createUser(request);
    }

    @Transactional
    public UserResponse updateUserAsSuperAdmin(Long actorUserId, Long targetUserId, UpdateUserRequest request) {
        User actor = userRepository.findById(actorUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (actor.getRole() != UserRole.CURATOR
                || actor.getCuratorGlobalRole() != CuratorGlobalRole.SUPER_ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Редагування користувачів — лише для супер-адміна");
        }

        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Користувача не знайдено"));

        String newEmail = request.getEmail().trim().toLowerCase();
        if (!target.getEmail().equals(newEmail)) {
            userRepository.findByEmail(newEmail).ifPresent(u -> {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Цей email вже використовується");
            });
        }

        target.setEmail(newEmail);
        target.setFirstName(request.getFirstName().trim());
        target.setLastName(request.getLastName().trim());
        target.setRole(request.getRole());
        
        CuratorGlobalRole cgr = CuratorGlobalRole.NONE;
        if (request.getRole() == UserRole.CURATOR && request.getCuratorGlobalRole() != null) {
            cgr = request.getCuratorGlobalRole();
        }
        target.setCuratorGlobalRole(cgr);

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            target.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        return toResponse(target);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> findByRoleForActor(SecurityUserPrincipal actor, UserRole requestedRole) {
        validateListUsersRole(actor, requestedRole);
        return findByRole(requestedRole);
    }

    private static void validateListUsersRole(SecurityUserPrincipal actor, UserRole requestedRole) {
        if (actor.role() == UserRole.LEARNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (actor.role() == UserRole.CURATOR && actor.curatorGlobalRole() == CuratorGlobalRole.SUPER_ADMIN) {
            return;
        }
        if (actor.role() == UserRole.CURATOR) {
            if (requestedRole != UserRole.EDUCATOR && requestedRole != UserRole.LEARNER) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
            return;
        }
        if (actor.role() == UserRole.EDUCATOR) {
            if (requestedRole != UserRole.LEARNER) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
            return;
        }
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .curatorGlobalRole(user.getCuratorGlobalRole())
                .build();
    }
}
