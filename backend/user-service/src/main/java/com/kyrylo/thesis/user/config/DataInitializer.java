package com.kyrylo.thesis.user.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.kyrylo.thesis.user.domain.User;
import com.kyrylo.thesis.user.domain.UserRole;
import com.kyrylo.thesis.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Ініціалізує тестових користувачів при першому запуску.
 * Виконується лише якщо БД порожня (немає жодного user).
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner seedUsers() {
        return args -> {
            if (userRepository.count() > 0) {
                log.info("[DataInitializer] Користувачів вже існує — пропуск сіду.");
                return;
            }

            userRepository.save(User.builder()
                    .email("curator@skillforge.dev")
                    .passwordHash(passwordEncoder.encode("curator123"))
                    .firstName("Олена")
                    .lastName("Коваль")
                    .role(UserRole.CURATOR)
                    .build());

            userRepository.save(User.builder()
                    .email("educator@skillforge.dev")
                    .passwordHash(passwordEncoder.encode("educator123"))
                    .firstName("Максим")
                    .lastName("Бондар")
                    .role(UserRole.EDUCATOR)
                    .build());

            userRepository.save(User.builder()
                    .email("learner@skillforge.dev")
                    .passwordHash(passwordEncoder.encode("learner123"))
                    .firstName("Дарина")
                    .lastName("Мельник")
                    .role(UserRole.LEARNER)
                    .build());

            userRepository.save(User.builder()
                    .email("learner2@skillforge.dev")
                    .passwordHash(passwordEncoder.encode("learner123"))
                    .firstName("Андрій")
                    .lastName("Шевченко")
                    .role(UserRole.LEARNER)
                    .build());

            log.info("[DataInitializer] ✅ Тестових користувачів створено: curator, educator, 2×learner");
        };
    }
}
