package com.kyrylo.thesis.user.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.kyrylo.thesis.user.domain.CuratorGlobalRole;
import com.kyrylo.thesis.user.domain.User;
import com.kyrylo.thesis.user.domain.UserRole;
import com.kyrylo.thesis.user.repository.UserRepository;
import com.kyrylo.thesis.user.security.SecurityUserPrincipal;
import com.kyrylo.thesis.user.web.dto.CreateUserRequest;
import com.kyrylo.thesis.user.web.dto.UserResponse;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class UserApplicationServiceTest {

    @Mock
    UserRepository userRepository;

    @Mock
    PasswordEncoder passwordEncoder;

    @InjectMocks
    UserApplicationService service;

    @Test
    void createUser_encodesAndSaves() {
        CreateUserRequest req = new CreateUserRequest();
        req.setEmail(" Test@ExAMPle.COM ");
        req.setPassword("pass");
        req.setFirstName(" First ");
        req.setLastName(" Last ");
        req.setRole(UserRole.EDUCATOR);

        when(passwordEncoder.encode("pass")).thenReturn("encoded");

        User saved = User.builder()
                .id(1L)
                .email("test@example.com")
                .passwordHash("encoded")
                .firstName("First")
                .lastName("Last")
                .role(UserRole.EDUCATOR)
                .curatorGlobalRole(CuratorGlobalRole.NONE)
                .build();

        when(userRepository.save(any(User.class))).thenReturn(saved);

        UserResponse resp = service.createUser(req);

        assertEquals(1L, resp.getId());
        assertEquals("test@example.com", resp.getEmail());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User toSave = captor.getValue();
        assertEquals("encoded", toSave.getPasswordHash());
        assertEquals("test@example.com", toSave.getEmail());
        assertEquals("First", toSave.getFirstName());
    }

    @Test
    void findById_notFound_throws() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> service.findById(99L));
    }

    @Test
    void findByRole_returnsMappedResponses() {
        User u1 = User.builder().id(2L).email("a@b").firstName("A").lastName("B").role(UserRole.LEARNER).build();
        when(userRepository.findByRole(UserRole.LEARNER)).thenReturn(List.of(u1));

        var res = service.findByRole(UserRole.LEARNER);
        assertEquals(1, res.size());
        assertEquals(2L, res.get(0).getId());
    }

    @Test
    void createUserAsSuperAdmin_authorized_and_unauthorized() {
        CreateUserRequest req = new CreateUserRequest();
        req.setEmail("x@x.com");
        req.setPassword("p");
        req.setFirstName("F");
        req.setLastName("L");
        req.setRole(UserRole.CURATOR);

        User actor = User.builder().id(10L).role(UserRole.CURATOR).curatorGlobalRole(CuratorGlobalRole.SUPER_ADMIN).build();
        when(userRepository.findById(10L)).thenReturn(Optional.of(actor));
        when(passwordEncoder.encode(any())).thenReturn("enc");
        when(userRepository.save(any())).thenAnswer(i -> {
            User arg = i.getArgument(0);
            arg.setId(5L);
            return arg;
        });

        UserResponse r = service.createUserAsSuperAdmin(10L, req);
        assertEquals(5L, r.getId());

        User non = User.builder().id(11L).role(UserRole.EDUCATOR).build();
        when(userRepository.findById(11L)).thenReturn(Optional.of(non));
        assertThrows(ResponseStatusException.class, () -> service.createUserAsSuperAdmin(11L, req));
    }

    @Test
    void findByRoleForActor_forbidden_for_learner() {
        var principal = new SecurityUserPrincipal(1L, UserRole.LEARNER, CuratorGlobalRole.NONE);
        assertThrows(ResponseStatusException.class, () -> service.findByRoleForActor(principal, UserRole.EDUCATOR));
    }
}
