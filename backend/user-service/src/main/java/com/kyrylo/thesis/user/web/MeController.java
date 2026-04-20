package com.kyrylo.thesis.user.web;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kyrylo.thesis.user.security.SecurityUserPrincipal;
import com.kyrylo.thesis.user.service.OrganizationApplicationService;
import com.kyrylo.thesis.user.web.dto.MeContextResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class MeController {

    private final OrganizationApplicationService organizationApplicationService;

    /** Контекст поточного користувача: організації та підролі (для course-service та UI). */
    @GetMapping("/context")
    public MeContextResponse getContext(@AuthenticationPrincipal SecurityUserPrincipal principal) {
        return organizationApplicationService.buildMeContext(principal.userId());
    }
}
