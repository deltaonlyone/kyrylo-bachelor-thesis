package com.kyrylo.thesis.user.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
import com.kyrylo.thesis.user.web.dto.MeContextResponse;
import com.kyrylo.thesis.user.web.dto.OrganizationContextEntry;
import com.kyrylo.thesis.user.web.dto.OrganizationMemberResponse;
import com.kyrylo.thesis.user.web.dto.OrganizationResponse;
import com.kyrylo.thesis.user.web.dto.RenameOrganizationRequest;
import com.kyrylo.thesis.user.web.dto.UpdateCuratorOrgRoleRequest;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrganizationApplicationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public MeContextResponse buildMeContext(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        boolean superAdmin = user.getRole() == UserRole.CURATOR
                && user.getCuratorGlobalRole() == CuratorGlobalRole.SUPER_ADMIN;

        List<OrganizationContextEntry> entries = new ArrayList<>();
        if (superAdmin) {
            List<Organization> all = organizationRepository.findAll();
            all.sort(Comparator.comparing(Organization::getId));
            for (Organization o : all) {
                var mem = organizationMemberRepository.findByOrganizationIdAndUserId(o.getId(), userId);
                entries.add(OrganizationContextEntry.builder()
                        .organizationId(o.getId())
                        .organizationName(o.getName())
                        .memberKind(mem.map(OrganizationMember::getMemberKind).orElse(null))
                        .curatorOrgRole(mem.map(OrganizationMember::getCuratorOrgRole).orElse(null))
                        .build());
            }
        } else {
            List<OrganizationMember> members = organizationMemberRepository.findByUserId(userId);
            members.sort(Comparator.comparing(m -> m.getOrganization().getId()));
            for (OrganizationMember m : members) {
                Organization o = m.getOrganization();
                entries.add(OrganizationContextEntry.builder()
                        .organizationId(o.getId())
                        .organizationName(o.getName())
                        .memberKind(m.getMemberKind())
                        .curatorOrgRole(m.getCuratorOrgRole())
                        .build());
            }
        }

        return MeContextResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .curatorGlobalRole(user.getCuratorGlobalRole())
                .superAdmin(superAdmin)
                .organizations(entries)
                .build();
    }

    @Transactional(readOnly = true)
    public List<OrganizationResponse> listOrganizations(SecurityUserPrincipal actor) {
        User user = requireUser(actor.userId());
        if (isSuperAdmin(user)) {
            return organizationRepository.findAll().stream()
                    .sorted(Comparator.comparing(Organization::getId))
                    .map(this::toOrganizationResponse)
                    .toList();
        }
        List<OrganizationMember> mine = organizationMemberRepository.findByUserId(user.getId());
        return mine.stream()
                .map(OrganizationMember::getOrganization)
                .distinct()
                .sorted(Comparator.comparing(Organization::getId))
                .map(this::toOrganizationResponse)
                .toList();
    }

    @Transactional
    public OrganizationResponse createOrganization(SecurityUserPrincipal actor, CreateOrganizationRequest request) {
        User user = requireUser(actor.userId());
        requireSuperAdmin(user);

        Organization org = Organization.builder()
                .name(request.getName().trim())
                .build();
        Organization saved = organizationRepository.save(org);
        return toOrganizationResponse(saved);
    }

    @Transactional
    public OrganizationResponse renameOrganization(
            SecurityUserPrincipal actor,
            Long organizationId,
            RenameOrganizationRequest request) {
        User user = requireUser(actor.userId());
        requireSuperAdmin(user);

        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Організацію не знайдено"));
        org.setName(request.getName().trim());
        return toOrganizationResponse(org);
    }

    @Transactional(readOnly = true)
    public List<OrganizationMemberResponse> listMembers(SecurityUserPrincipal actor, Long organizationId) {
        ensureCanViewOrgMembers(actor, organizationId);

        List<OrganizationMember> rows = organizationMemberRepository.findByOrganizationId(organizationId);
        rows.sort(Comparator.comparing(OrganizationMember::getUserId));

        List<OrganizationMemberResponse> result = new ArrayList<>();
        for (OrganizationMember m : rows) {
            User u = userRepository.findById(m.getUserId()).orElse(null);
            if (u == null) {
                continue;
            }
            result.add(OrganizationMemberResponse.builder()
                    .userId(u.getId())
                    .email(u.getEmail())
                    .firstName(u.getFirstName())
                    .lastName(u.getLastName())
                    .globalRole(u.getRole())
                    .memberKind(m.getMemberKind())
                    .curatorOrgRole(m.getCuratorOrgRole())
                    .build());
        }
        return result;
    }

    @Transactional
    public OrganizationMemberResponse inviteCurator(
            SecurityUserPrincipal actor,
            Long organizationId,
            InviteCuratorRequest request) {
        User actorUser = requireUser(actor.userId());
        ensureCanInviteCurator(actorUser, organizationId);

        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Користувач з таким email уже існує");
        }

        User created = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .role(UserRole.CURATOR)
                .curatorGlobalRole(CuratorGlobalRole.NONE)
                .build();
        User savedUser = userRepository.save(created);

        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        OrganizationMember membership = OrganizationMember.builder()
                .organization(organization)
                .userId(savedUser.getId())
                .memberKind(OrganizationMemberKind.CURATOR)
                .curatorOrgRole(CuratorOrgRole.STANDARD)
                .build();
        organizationMemberRepository.save(membership);

        return OrganizationMemberResponse.builder()
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .firstName(savedUser.getFirstName())
                .lastName(savedUser.getLastName())
                .globalRole(savedUser.getRole())
                .memberKind(OrganizationMemberKind.CURATOR)
                .curatorOrgRole(CuratorOrgRole.STANDARD)
                .build();
    }

    @Transactional
    public void addEducator(SecurityUserPrincipal actor, Long organizationId, AddOrgMemberByIdRequest body) {
        User actorUser = requireUser(actor.userId());
        ensureCuratorCanManageEducators(actorUser, organizationId);

        User target = userRepository.findById(body.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Користувача не знайдено"));
        if (target.getRole() != UserRole.EDUCATOR) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Користувач має мати роль EDUCATOR");
        }

        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        organizationMemberRepository.findByOrganizationIdAndUserId(organizationId, target.getId())
                .ifPresent(m -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Користувач уже в організації");
                });

        organizationMemberRepository.save(OrganizationMember.builder()
                .organization(organization)
                .userId(target.getId())
                .memberKind(OrganizationMemberKind.EDUCATOR)
                .build());
    }

    @Transactional
    public void addLearner(SecurityUserPrincipal actor, Long organizationId, AddOrgMemberByIdRequest body) {
        User actorUser = requireUser(actor.userId());
        ensureCanRegisterLearnerInOrg(actorUser, organizationId);

        User target = userRepository.findById(body.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (target.getRole() != UserRole.LEARNER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Користувач має мати роль LEARNER");
        }

        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        organizationMemberRepository.findByOrganizationIdAndUserId(organizationId, target.getId())
                .ifPresent(m -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Користувач уже в організації");
                });

        organizationMemberRepository.save(OrganizationMember.builder()
                .organization(organization)
                .userId(target.getId())
                .memberKind(OrganizationMemberKind.LEARNER)
                .build());
    }

    @Transactional
    public void updateCuratorOrgRole(
            SecurityUserPrincipal actor,
            Long organizationId,
            Long targetUserId,
            UpdateCuratorOrgRoleRequest request) {
        User actorUser = requireUser(actor.userId());
        requireSuperAdmin(actorUser);

        OrganizationMember member = organizationMemberRepository
                .findByOrganizationIdAndUserId(organizationId, targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (member.getMemberKind() != OrganizationMemberKind.CURATOR) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Користувач не є куратором у цій організації");
        }

        member.setCuratorOrgRole(request.getCuratorOrgRole());
    }

    /* ─── helpers ─── */

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private static boolean isSuperAdmin(User user) {
        return user.getRole() == UserRole.CURATOR
                && user.getCuratorGlobalRole() == CuratorGlobalRole.SUPER_ADMIN;
    }

    private void requireSuperAdmin(User user) {
        if (!isSuperAdmin(user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Потрібні права супер-адміністратора");
        }
    }

    private void ensureCanViewOrgMembers(SecurityUserPrincipal actor, Long organizationId) {
        User user = requireUser(actor.userId());
        if (isSuperAdmin(user)) {
            return;
        }
        OrganizationMember m = organizationMemberRepository
                .findByOrganizationIdAndUserId(organizationId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));

        if (m.getMemberKind() == OrganizationMemberKind.CURATOR
                || m.getMemberKind() == OrganizationMemberKind.EDUCATOR) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }

    private void ensureCanInviteCurator(User actorUser, Long organizationId) {
        if (isSuperAdmin(actorUser)) {
            return;
        }
        OrganizationMember m = organizationMemberRepository
                .findByOrganizationIdAndUserId(organizationId, actorUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));

        if (m.getMemberKind() != OrganizationMemberKind.CURATOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (m.getCuratorOrgRole() != CuratorOrgRole.ORG_ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Лише адмін організації або супер-адмін");
        }
    }

    private void ensureCuratorCanManageEducators(User actorUser, Long organizationId) {
        if (isSuperAdmin(actorUser)) {
            return;
        }
        OrganizationMember m = organizationMemberRepository
                .findByOrganizationIdAndUserId(organizationId, actorUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));

        if (m.getMemberKind() != OrganizationMemberKind.CURATOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    /** Куратор або викладач організації (або супер-адмін). */
    private void ensureCanRegisterLearnerInOrg(User actorUser, Long organizationId) {
        if (isSuperAdmin(actorUser)) {
            return;
        }
        OrganizationMember m = organizationMemberRepository
                .findByOrganizationIdAndUserId(organizationId, actorUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));

        if (m.getMemberKind() == OrganizationMemberKind.CURATOR
                || m.getMemberKind() == OrganizationMemberKind.EDUCATOR) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }

    private OrganizationResponse toOrganizationResponse(Organization o) {
        return OrganizationResponse.builder()
                .id(o.getId())
                .name(o.getName())
                .createdAt(o.getCreatedAt())
                .build();
    }
}
