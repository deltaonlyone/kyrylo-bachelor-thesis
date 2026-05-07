package com.kyrylo.thesis.course.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.kyrylo.thesis.course.security.SecurityUserPrincipal;
import com.kyrylo.thesis.course.service.SkillApplicationService;
import com.kyrylo.thesis.course.web.dto.CourseSkillRequest;
import com.kyrylo.thesis.course.web.dto.CourseSkillResponse;
import com.kyrylo.thesis.course.web.dto.CreateSkillRequest;
import com.kyrylo.thesis.course.web.dto.SkillResponse;
import com.kyrylo.thesis.course.web.dto.UserSkillResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillApplicationService skillService;

    /** GET /api/skills — список всіх навичок з довідника. */
    @GetMapping
    public List<SkillResponse> listSkills() {
        return skillService.listSkills();
    }

    /** POST /api/skills — створити нову навичку (Curator). */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SkillResponse createSkill(
            HttpServletRequest httpRequest,
            @Valid @RequestBody CreateSkillRequest body) {
        return skillService.createSkill(bearer(httpRequest), body);
    }

    /** GET /api/skills/course/{courseId} — навички, які дає курс. */
    @GetMapping("/course/{courseId}")
    public List<CourseSkillResponse> getCourseSkills(@PathVariable Long courseId) {
        return skillService.getCourseSkills(courseId);
    }

    /** PUT /api/skills/course/{courseId} — оновити навички курсу (Curator). */
    @PutMapping("/course/{courseId}")
    public List<CourseSkillResponse> setCourseSkills(
            HttpServletRequest httpRequest,
            @PathVariable Long courseId,
            @Valid @RequestBody List<CourseSkillRequest> body) {
        return skillService.setCourseSkills(bearer(httpRequest), courseId, body);
    }

    /** GET /api/skills/my — мої навички (з JWT). */
    @GetMapping("/my")
    public List<UserSkillResponse> mySkills(@AuthenticationPrincipal SecurityUserPrincipal principal) {
        return skillService.getUserSkills(principal.userId());
    }

    /** GET /api/skills/user/{userId} — навички конкретного працівника. */
    @GetMapping("/user/{userId}")
    public List<UserSkillResponse> getUserSkills(@PathVariable Long userId) {
        return skillService.getUserSkills(userId);
    }

    private static String bearer(HttpServletRequest req) {
        String h = req.getHeader(org.springframework.http.HttpHeaders.AUTHORIZATION);
        if (h == null || !h.startsWith("Bearer ")) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Потрібен заголовок Authorization");
        }
        return h;
    }
}
