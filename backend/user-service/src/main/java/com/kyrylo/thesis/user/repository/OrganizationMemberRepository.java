package com.kyrylo.thesis.user.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.kyrylo.thesis.user.domain.OrganizationMember;
import com.kyrylo.thesis.user.domain.OrganizationMemberKind;

public interface OrganizationMemberRepository extends JpaRepository<OrganizationMember, Long> {

    @EntityGraph(attributePaths = "organization")
    List<OrganizationMember> findByUserId(Long userId);

    List<OrganizationMember> findByOrganizationId(Long organizationId);

    Optional<OrganizationMember> findByOrganizationIdAndUserId(Long organizationId, Long userId);

    boolean existsByOrganizationIdAndUserIdAndMemberKind(
            Long organizationId, Long userId, OrganizationMemberKind memberKind);
}
