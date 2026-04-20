package com.kyrylo.thesis.course.security;

import com.kyrylo.thesis.course.integration.userservice.CuratorGlobalRole;
import com.kyrylo.thesis.course.integration.userservice.UserRole;

public record SecurityUserPrincipal(Long userId, UserRole role, CuratorGlobalRole curatorGlobalRole) {}
