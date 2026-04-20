package com.kyrylo.thesis.user.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

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

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner seedUsers() {
        return args -> {
            if (userRepository.count() > 0) {
                log.info("[DataInitializer] Користувачів вже існує — пропуск сіду.");
                return;
            }

            User superCurator = userRepository.save(User.builder()
                    .email("supercurator@skillforge.dev")
                    .passwordHash(passwordEncoder.encode("supercurator123"))
                    .firstName("Ганна")
                    .lastName("Супер")
                    .role(UserRole.CURATOR)
                    .curatorGlobalRole(CuratorGlobalRole.SUPER_ADMIN)
                    .build());

            User curator = userRepository.save(User.builder()
                    .email("curator@skillforge.dev")
                    .passwordHash(passwordEncoder.encode("curator123"))
                    .firstName("Олена")
                    .lastName("Коваль")
                    .role(UserRole.CURATOR)
                    .curatorGlobalRole(CuratorGlobalRole.NONE)
                    .build());

            User educator = userRepository.save(User.builder()
                    .email("educator@skillforge.dev")
                    .passwordHash(passwordEncoder.encode("educator123"))
                    .firstName("Максим")
                    .lastName("Бондар")
                    .role(UserRole.EDUCATOR)
                    .curatorGlobalRole(CuratorGlobalRole.NONE)
                    .build());

            User learner = userRepository.save(User.builder()
                    .email("learner@skillforge.dev")
                    .passwordHash(passwordEncoder.encode("learner123"))
                    .firstName("Дарина")
                    .lastName("Мельник")
                    .role(UserRole.LEARNER)
                    .curatorGlobalRole(CuratorGlobalRole.NONE)
                    .build());

            User learner2 = userRepository.save(User.builder()
                    .email("learner2@skillforge.dev")
                    .passwordHash(passwordEncoder.encode("learner123"))
                    .firstName("Андрій")
                    .lastName("Шевченко")
                    .role(UserRole.LEARNER)
                    .curatorGlobalRole(CuratorGlobalRole.NONE)
                    .build());

            Organization org = organizationRepository.save(Organization.builder()
                    .name("SkillForge Demo")
                    .build());

            organizationMemberRepository.save(OrganizationMember.builder()
                    .organization(org)
                    .userId(curator.getId())
                    .memberKind(OrganizationMemberKind.CURATOR)
                    .curatorOrgRole(CuratorOrgRole.ORG_ADMIN)
                    .build());

            organizationMemberRepository.save(OrganizationMember.builder()
                    .organization(org)
                    .userId(educator.getId())
                    .memberKind(OrganizationMemberKind.EDUCATOR)
                    .build());

            organizationMemberRepository.save(OrganizationMember.builder()
                    .organization(org)
                    .userId(learner.getId())
                    .memberKind(OrganizationMemberKind.LEARNER)
                    .build());

            organizationMemberRepository.save(OrganizationMember.builder()
                    .organization(org)
                    .userId(learner2.getId())
                    .memberKind(OrganizationMemberKind.LEARNER)
                    .build());

            log.info(
                    "[DataInitializer] ✅ Сід: supercurator ({}), curator, educator, 2 learners, орг. «{}» id={}",
                    superCurator.getEmail(),
                    org.getName(),
                    org.getId());
        };
    }
}
