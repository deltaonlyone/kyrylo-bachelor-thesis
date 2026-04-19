package com.kyrylo.thesis.user.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kyrylo.thesis.user.domain.User;
import com.kyrylo.thesis.user.domain.UserRole;

public interface UserRepository extends JpaRepository<User, Long> {

    List<User> findByRole(UserRole role);

    Optional<User> findByEmail(String email);
}
