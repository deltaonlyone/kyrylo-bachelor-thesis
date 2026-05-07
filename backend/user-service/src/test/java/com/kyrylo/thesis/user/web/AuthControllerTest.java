package com.kyrylo.thesis.user.web;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.kyrylo.thesis.user.domain.User;
import com.kyrylo.thesis.user.repository.UserRepository;
import com.kyrylo.thesis.user.security.JwtTokenProvider;
import com.kyrylo.thesis.user.web.dto.LoginRequest;
import com.kyrylo.thesis.user.web.dto.LoginResponse;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    UserRepository userRepository;

    @Mock
    PasswordEncoder passwordEncoder;

    @Mock
    JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    AuthController controller;

    @Test
    void login_success_returns_token() {
        LoginRequest req = new LoginRequest();
        req.setEmail("a@b.com");
        req.setPassword("p");

        User user = User.builder().id(7L).email("a@b.com").passwordHash("hash").firstName("F").lastName("L").build();
        when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("p", "hash")).thenReturn(true);
        when(jwtTokenProvider.generateToken(anyLong(), anyString(), any(), any())).thenReturn("tok");

        LoginResponse resp = controller.login(req);
        assertEquals("tok", resp.getToken());
        assertEquals(7L, resp.getUserId());
        assertEquals("a@b.com", resp.getEmail());
    }

    @Test
    void login_wrong_password_throws() {
        LoginRequest req = new LoginRequest();
        req.setEmail("a@b.com");
        req.setPassword("p");

        User user = User.builder().id(7L).email("a@b.com").passwordHash("hash").build();
        when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("p", "hash")).thenReturn(false);

        assertThrows(ResponseStatusException.class, () -> controller.login(req));
    }
}
