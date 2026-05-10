package com.kyrylo.thesis.user.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.kyrylo.thesis.user.domain.CuratorGlobalRole;
import com.kyrylo.thesis.user.domain.CuratorOrgRole;
import com.kyrylo.thesis.user.domain.Organization;
import com.kyrylo.thesis.user.domain.OrganizationMember;
import com.kyrylo.thesis.user.domain.OrganizationMemberKind;
import com.kyrylo.thesis.user.domain.User;
import com.kyrylo.thesis.user.domain.UserRole;
import com.kyrylo.thesis.user.repository.OrganizationMemberRepository;
import com.kyrylo.thesis.user.repository.OrganizationRepository;
import com.kyrylo.thesis.user.repository.UserRepository;
import com.kyrylo.thesis.user.security.SecurityUserPrincipal;
import com.kyrylo.thesis.user.web.dto.AddOrgMemberByIdRequest;
import com.kyrylo.thesis.user.web.dto.CreateOrganizationRequest;
import com.kyrylo.thesis.user.web.dto.InviteCuratorRequest;
import com.kyrylo.thesis.user.web.dto.RenameOrganizationRequest;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class OrganizationApplicationServiceTest {

    @Mock OrganizationRepository organizationRepository;
    @Mock OrganizationMemberRepository organizationMemberRepository;
    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;

    @InjectMocks
    OrganizationApplicationService service;

    // ── helpers ───────────────────────────────────────────────────────────────

    private User superAdmin(Long id) {
        return User.builder().id(id).email("sa@x.com").firstName("S").lastName("A")
                .role(UserRole.CURATOR).curatorGlobalRole(CuratorGlobalRole.SUPER_ADMIN).build();
    }

    private User regularCurator(Long id) {
        return User.builder().id(id).email("c@x.com").firstName("C").lastName("U")
                .role(UserRole.CURATOR).curatorGlobalRole(CuratorGlobalRole.NONE).build();
    }

    private User educator(Long id) {
        return User.builder().id(id).email("e@x.com").firstName("E").lastName("D")
                .role(UserRole.EDUCATOR).build();
    }

    private User learner(Long id) {
        return User.builder().id(id).email("l@x.com").firstName("L").lastName("R")
                .role(UserRole.LEARNER).build();
    }

    private SecurityUserPrincipal principal(Long id, UserRole role, CuratorGlobalRole cgr) {
        return new SecurityUserPrincipal(id, role, cgr);
    }

    private Organization org(Long id, String name) {
        Organization o = new Organization();
        o.setId(id);
        o.setName(name);
        return o;
    }

    // ── createOrganization ────────────────────────────────────────────────────

    @Test
    void createOrganization_superAdmin_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(superAdmin(1L)));
        Organization saved = org(10L, "Org A");
        when(organizationRepository.save(any())).thenReturn(saved);

        CreateOrganizationRequest req = new CreateOrganizationRequest();
        req.setName("Org A");

        var resp = service.createOrganization(
                principal(1L, UserRole.CURATOR, CuratorGlobalRole.SUPER_ADMIN), req);
        assertEquals(10L, resp.getId());
        assertEquals("Org A", resp.getName());
    }

    @Test
    void createOrganization_notSuperAdmin_throws() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(regularCurator(2L)));

        CreateOrganizationRequest req = new CreateOrganizationRequest();
        req.setName("Org B");

        assertThrows(ResponseStatusException.class, () ->
                service.createOrganization(principal(2L, UserRole.CURATOR, CuratorGlobalRole.NONE), req));
    }

    // ── renameOrganization ────────────────────────────────────────────────────

    @Test
    void renameOrganization_superAdmin_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(superAdmin(1L)));
        Organization existing = org(10L, "Old Name");
        when(organizationRepository.findById(10L)).thenReturn(Optional.of(existing));

        RenameOrganizationRequest req = new RenameOrganizationRequest();
        req.setName("New Name");

        var resp = service.renameOrganization(
                principal(1L, UserRole.CURATOR, CuratorGlobalRole.SUPER_ADMIN), 10L, req);
        assertEquals("New Name", resp.getName());
    }

    @Test
    void renameOrganization_orgNotFound_throws() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(superAdmin(1L)));
        when(organizationRepository.findById(99L)).thenReturn(Optional.empty());

        RenameOrganizationRequest req = new RenameOrganizationRequest();
        req.setName("X");

        assertThrows(ResponseStatusException.class, () ->
                service.renameOrganization(
                        principal(1L, UserRole.CURATOR, CuratorGlobalRole.SUPER_ADMIN), 99L, req));
    }

    // ── listOrganizations ─────────────────────────────────────────────────────

    @Test
    void listOrganizations_superAdmin_returnsAll() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(superAdmin(1L)));
        when(organizationRepository.findAll()).thenReturn(List.of(org(1L, "A"), org(2L, "B")));

        var list = service.listOrganizations(
                principal(1L, UserRole.CURATOR, CuratorGlobalRole.SUPER_ADMIN));
        assertEquals(2, list.size());
    }

    @Test
    void listOrganizations_regularCurator_returnsOnlyOwn() {
        User curator = regularCurator(2L);
        when(userRepository.findById(2L)).thenReturn(Optional.of(curator));

        Organization o = org(10L, "My Org");
        OrganizationMember member = OrganizationMember.builder()
                .organization(o).userId(2L).memberKind(OrganizationMemberKind.CURATOR).build();
        when(organizationMemberRepository.findByUserId(2L)).thenReturn(List.of(member));

        var list = service.listOrganizations(
                principal(2L, UserRole.CURATOR, CuratorGlobalRole.NONE));
        assertEquals(1, list.size());
        assertEquals("My Org", list.get(0).getName());
    }

    // ── inviteCurator ─────────────────────────────────────────────────────────

    @Test
    void inviteCurator_superAdmin_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(superAdmin(1L)));
        when(userRepository.findByEmail("new@x.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("pass")).thenReturn("encoded");

        Organization o = org(10L, "Org");
        when(organizationRepository.findById(10L)).thenReturn(Optional.of(o));

        User newCurator = User.builder().id(20L).email("new@x.com").firstName("N").lastName("C")
                .role(UserRole.CURATOR).curatorGlobalRole(CuratorGlobalRole.NONE).build();
        when(userRepository.save(any())).thenReturn(newCurator);
        when(organizationMemberRepository.save(any())).thenReturn(
                OrganizationMember.builder().organization(o).userId(20L)
                        .memberKind(OrganizationMemberKind.CURATOR)
                        .curatorOrgRole(CuratorOrgRole.STANDARD).build());

        InviteCuratorRequest req = new InviteCuratorRequest();
        req.setEmail("new@x.com");
        req.setPassword("pass");
        req.setFirstName("N");
        req.setLastName("C");

        var resp = service.inviteCurator(
                principal(1L, UserRole.CURATOR, CuratorGlobalRole.SUPER_ADMIN), 10L, req);
        assertEquals(20L, resp.getUserId());
        assertEquals(OrganizationMemberKind.CURATOR, resp.getMemberKind());
    }

    @Test
    void inviteCurator_emailAlreadyExists_throws409() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(superAdmin(1L)));
        when(userRepository.findByEmail("existing@x.com"))
                .thenReturn(Optional.of(regularCurator(5L)));

        InviteCuratorRequest req = new InviteCuratorRequest();
        req.setEmail("existing@x.com");
        req.setPassword("pass");
        req.setFirstName("N");
        req.setLastName("C");

        assertThrows(ResponseStatusException.class, () ->
                service.inviteCurator(
                        principal(1L, UserRole.CURATOR, CuratorGlobalRole.SUPER_ADMIN), 10L, req));
    }

    // ── addEducator ───────────────────────────────────────────────────────────

    @Test
    void addEducator_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(superAdmin(1L)));
        User edu = educator(5L);
        when(userRepository.findById(5L)).thenReturn(Optional.of(edu));
        Organization o = org(10L, "Org");
        when(organizationRepository.findById(10L)).thenReturn(Optional.of(o));
        when(organizationMemberRepository.findByOrganizationIdAndUserId(10L, 5L))
                .thenReturn(Optional.empty());

        AddOrgMemberByIdRequest req = new AddOrgMemberByIdRequest();
        req.setUserId(5L);

        assertDoesNotThrow(() -> service.addEducator(
                principal(1L, UserRole.CURATOR, CuratorGlobalRole.SUPER_ADMIN), 10L, req));
        verify(organizationMemberRepository).save(any());
    }

    @Test
    void addEducator_notEducatorRole_throws() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(superAdmin(1L)));
        User notEdu = learner(5L);
        when(userRepository.findById(5L)).thenReturn(Optional.of(notEdu));

        AddOrgMemberByIdRequest req = new AddOrgMemberByIdRequest();
        req.setUserId(5L);

        assertThrows(ResponseStatusException.class, () ->
                service.addEducator(
                        principal(1L, UserRole.CURATOR, CuratorGlobalRole.SUPER_ADMIN), 10L, req));
    }

    @Test
    void addEducator_alreadyInOrg_throws409() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(superAdmin(1L)));
        User edu = educator(5L);
        when(userRepository.findById(5L)).thenReturn(Optional.of(edu));
        Organization o = org(10L, "Org");
        when(organizationRepository.findById(10L)).thenReturn(Optional.of(o));
        when(organizationMemberRepository.findByOrganizationIdAndUserId(10L, 5L))
                .thenReturn(Optional.of(OrganizationMember.builder().build()));

        AddOrgMemberByIdRequest req = new AddOrgMemberByIdRequest();
        req.setUserId(5L);

        assertThrows(ResponseStatusException.class, () ->
                service.addEducator(
                        principal(1L, UserRole.CURATOR, CuratorGlobalRole.SUPER_ADMIN), 10L, req));
    }

    // ── addLearner ────────────────────────────────────────────────────────────

    @Test
    void addLearner_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(superAdmin(1L)));
        User l = learner(6L);
        when(userRepository.findById(6L)).thenReturn(Optional.of(l));
        Organization o = org(10L, "Org");
        when(organizationRepository.findById(10L)).thenReturn(Optional.of(o));
        when(organizationMemberRepository.findByOrganizationIdAndUserId(10L, 6L))
                .thenReturn(Optional.empty());

        AddOrgMemberByIdRequest req = new AddOrgMemberByIdRequest();
        req.setUserId(6L);

        assertDoesNotThrow(() -> service.addLearner(
                principal(1L, UserRole.CURATOR, CuratorGlobalRole.SUPER_ADMIN), 10L, req));
        verify(organizationMemberRepository).save(any());
    }

    @Test
    void addLearner_notLearnerRole_throws() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(superAdmin(1L)));
        User notLearner = educator(6L);
        when(userRepository.findById(6L)).thenReturn(Optional.of(notLearner));

        AddOrgMemberByIdRequest req = new AddOrgMemberByIdRequest();
        req.setUserId(6L);

        assertThrows(ResponseStatusException.class, () ->
                service.addLearner(
                        principal(1L, UserRole.CURATOR, CuratorGlobalRole.SUPER_ADMIN), 10L, req));
    }

    // ── removeMember ──────────────────────────────────────────────────────────

    @Test
    void removeMember_superAdmin_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(superAdmin(1L)));
        OrganizationMember member = OrganizationMember.builder()
                .userId(5L).memberKind(OrganizationMemberKind.LEARNER).build();
        when(organizationMemberRepository.findByOrganizationIdAndUserId(10L, 5L))
                .thenReturn(Optional.of(member));

        assertDoesNotThrow(() -> service.removeMember(
                principal(1L, UserRole.CURATOR, CuratorGlobalRole.SUPER_ADMIN), 10L, 5L));
        verify(organizationMemberRepository).delete(member);
    }

    @Test
    void removeMember_memberNotFound_throws() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(superAdmin(1L)));
        when(organizationMemberRepository.findByOrganizationIdAndUserId(10L, 99L))
                .thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () ->
                service.removeMember(
                        principal(1L, UserRole.CURATOR, CuratorGlobalRole.SUPER_ADMIN), 10L, 99L));
    }

    // ── buildMeContext ────────────────────────────────────────────────────────

    @Test
    void buildMeContext_superAdmin_includesAllOrgs() {
        User sa = superAdmin(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(sa));
        Organization o1 = org(1L, "Org1");
        Organization o2 = org(2L, "Org2");
        when(organizationRepository.findAll()).thenReturn(new java.util.ArrayList<>(List.of(o1, o2)));
        when(organizationMemberRepository.findByOrganizationIdAndUserId(anyLong(), eq(1L)))
                .thenReturn(Optional.empty());

        var ctx = service.buildMeContext(1L);
        assertTrue(ctx.isSuperAdmin());
        assertEquals(2, ctx.getOrganizations().size());
    }

    @Test
    void buildMeContext_regularUser_includesOnlyOwnOrgs() {
        User curator = regularCurator(2L);
        when(userRepository.findById(2L)).thenReturn(Optional.of(curator));
        Organization o = org(10L, "My Org");
        OrganizationMember member = OrganizationMember.builder()
                .organization(o).userId(2L).memberKind(OrganizationMemberKind.CURATOR)
                .curatorOrgRole(CuratorOrgRole.STANDARD).build();
        when(organizationMemberRepository.findByUserId(2L))
                .thenReturn(new java.util.ArrayList<>(List.of(member)));

        var ctx = service.buildMeContext(2L);
        assertFalse(ctx.isSuperAdmin());
        assertEquals(1, ctx.getOrganizations().size());
        assertEquals(10L, ctx.getOrganizations().get(0).getOrganizationId());
    }
}
