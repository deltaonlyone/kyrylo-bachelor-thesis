package com.kyrylo.thesis.course.service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kyrylo.thesis.course.domain.Course;
import com.kyrylo.thesis.course.domain.CourseSkill;
import com.kyrylo.thesis.course.domain.Skill;
import com.kyrylo.thesis.course.domain.SkillLevel;
import com.kyrylo.thesis.course.domain.UserSkill;
import com.kyrylo.thesis.course.integration.UserDirectoryClient;
import com.kyrylo.thesis.course.integration.userservice.MeContextDto;
import com.kyrylo.thesis.course.integration.userservice.UserRole;
import com.kyrylo.thesis.course.repository.CourseRepository;
import com.kyrylo.thesis.course.repository.CourseSkillRepository;
import com.kyrylo.thesis.course.repository.SkillRepository;
import com.kyrylo.thesis.course.repository.UserSkillRepository;
import com.kyrylo.thesis.course.web.dto.CourseSkillRequest;
import com.kyrylo.thesis.course.web.dto.CourseSkillResponse;
import com.kyrylo.thesis.course.web.dto.CreateSkillRequest;
import com.kyrylo.thesis.course.web.dto.SkillResponse;
import com.kyrylo.thesis.course.web.dto.UserSkillResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class SkillApplicationService {

    private final SkillRepository skillRepository;
    private final CourseSkillRepository courseSkillRepository;
    private final UserSkillRepository userSkillRepository;
    private final CourseRepository courseRepository;
    private final UserDirectoryClient userDirectoryClient;

    /* ─── Довідник навичок ──────────────────────────────────────── */

    /** Список всіх навичок з довідника. */
    @Transactional(readOnly = true)
    public List<SkillResponse> listSkills() {
        return skillRepository.findAllByOrderByNameAsc().stream()
                .map(this::toSkillResponse)
                .toList();
    }

    /** Створити нову навичку (Curator). */
    @Transactional
    public SkillResponse createSkill(String authorizationHeader, CreateSkillRequest request) {
        MeContextDto ctx = userDirectoryClient.fetchMeContext(authorizationHeader);
        if (ctx.getRole() != UserRole.CURATOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Тільки куратор може створювати навички");
        }

        if (skillRepository.findByNameIgnoreCase(request.getName().trim()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Навичка з такою назвою вже існує");
        }

        Skill skill = Skill.builder()
                .name(request.getName().trim())
                .category(request.getCategory())
                .build();
        Skill saved = skillRepository.save(skill);
        return toSkillResponse(saved);
    }

    /* ─── Навички курсу ────────────────────────────────────────── */

    /** Отримати навички, які присвоює курс. */
    @Transactional(readOnly = true)
    public List<CourseSkillResponse> getCourseSkills(Long courseId) {
        return courseSkillRepository.findByCourseIdWithSkill(courseId).stream()
                .map(this::toCourseSkillResponse)
                .toList();
    }

    /** Встановити навички курсу (повна заміна). */
    @Transactional
    public List<CourseSkillResponse> setCourseSkills(
            String authorizationHeader, Long courseId, List<CourseSkillRequest> requests) {
        MeContextDto ctx = userDirectoryClient.fetchMeContext(authorizationHeader);
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Курс не знайдено"));

        assertCuratorCanManage(ctx, course.getOrganizationId());

        // Видалити старі зв'язки
        courseSkillRepository.deleteByCourseId(courseId);
        courseSkillRepository.flush();

        // Створити нові
        List<CourseSkill> newSkills = requests.stream()
                .map(req -> {
                    Skill skill = skillRepository.findById(req.getSkillId())
                            .orElseThrow(() -> new ResponseStatusException(
                                    HttpStatus.BAD_REQUEST, "Навичка з id=" + req.getSkillId() + " не знайдена"));
                    return CourseSkill.builder()
                            .course(course)
                            .skill(skill)
                            .skillLevel(req.getSkillLevel())
                            .build();
                })
                .toList();

        courseSkillRepository.saveAll(newSkills);
        return courseSkillRepository.findByCourseIdWithSkill(courseId).stream()
                .map(this::toCourseSkillResponse)
                .toList();
    }

    /* ─── Профіль навичок працівника ───────────────────────────── */

    /** Навички конкретного працівника. */
    @Transactional(readOnly = true)
    public List<UserSkillResponse> getUserSkills(Long userId) {
        return userSkillRepository.findByUserIdWithDetails(userId).stream()
                .map(this::toUserSkillResponse)
                .toList();
    }

    /* ─── Нарахування навичок (внутрішній виклик) ───────────────── */

    /**
     * Автоматичне нарахування навичок після успішного проходження курсу.
     * Якщо працівник вже має навичку на вищому рівні — не понижується.
     */
    @Transactional
    public void awardSkillsForCompletedCourse(Long userId, Long courseId) {
        List<CourseSkill> courseSkills = courseSkillRepository.findByCourseIdWithSkill(courseId);
        if (courseSkills.isEmpty()) {
            return;
        }

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        for (CourseSkill cs : courseSkills) {
            SkillLevel awardedLevel = cs.getSkillLevel();
            Optional<UserSkill> existing = userSkillRepository
                    .findByUserIdAndSkillId(userId, cs.getSkill().getId());

            if (existing.isPresent()) {
                UserSkill us = existing.get();
                // Оновлюємо тільки якщо новий рівень вищий
                if (awardedLevel.isHigherThan(us.getSkillLevel())) {
                    us.setSkillLevel(awardedLevel);
                    us.setAcquiredAt(Instant.now());
                    us.setCourse(course);
                    userSkillRepository.save(us);
                }
            } else {
                UserSkill newSkill = UserSkill.builder()
                        .userId(userId)
                        .skill(cs.getSkill())
                        .skillLevel(awardedLevel)
                        .acquiredAt(Instant.now())
                        .course(course)
                        .build();
                userSkillRepository.save(newSkill);
            }
        }
    }

    /* ─── Допоміжні ────────────────────────────────────────────── */

    private void assertCuratorCanManage(MeContextDto ctx, Long organizationId) {
        if (ctx.getRole() != UserRole.CURATOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Лише куратор може керувати навичками курсу");
        }
        if (OrgAccess.isSuperCurator(ctx)) {
            return;
        }
        if (!OrgAccess.curatorOrganizationIds(ctx).contains(organizationId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Немає доступу до цієї організації");
        }
    }

    private SkillResponse toSkillResponse(Skill s) {
        return SkillResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .category(s.getCategory())
                .build();
    }

    private CourseSkillResponse toCourseSkillResponse(CourseSkill cs) {
        return CourseSkillResponse.builder()
                .skillId(cs.getSkill().getId())
                .skillName(cs.getSkill().getName())
                .category(cs.getSkill().getCategory())
                .skillLevel(cs.getSkillLevel())
                .build();
    }

    private UserSkillResponse toUserSkillResponse(UserSkill us) {
        return UserSkillResponse.builder()
                .skillId(us.getSkill().getId())
                .skillName(us.getSkill().getName())
                .category(us.getSkill().getCategory())
                .skillLevel(us.getSkillLevel())
                .acquiredAt(us.getAcquiredAt())
                .courseId(us.getCourse() != null ? us.getCourse().getId() : null)
                .courseTitle(us.getCourse() != null ? us.getCourse().getTitle() : null)
                .build();
    }
}
