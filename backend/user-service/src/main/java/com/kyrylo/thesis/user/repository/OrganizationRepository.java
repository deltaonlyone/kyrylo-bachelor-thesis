package com.kyrylo.thesis.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kyrylo.thesis.user.domain.Organization;

public interface OrganizationRepository extends JpaRepository<Organization, Long> {
}
