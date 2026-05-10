package com.kyrylo.thesis.course.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.kyrylo.thesis.course.domain.Course;
import com.kyrylo.thesis.course.domain.CourseSkill;
import com.kyrylo.thesis.course.domain.CourseStatus;
import com.kyrylo.thesis.course.domain.Skill;
import com.kyrylo.thesis.course.domain.SkillCategory;
import com.kyrylo.thesis.course.domain.SkillLevel;
import com.kyrylo.thesis.course.domain.UserSkill;
import com.kyrylo.thesis.course.integration.UserDirectoryClient;
import com.kyrylo.thesis.course.integration.userservice.MeContextDto;
import com.kyrylo.thesis.course.integration.userservice.OrganizationContextDto;
import com.kyrylo.thesis.course.integration.userservice.OrganizationMemberKind;
import com.kyrylo.thesis.course.integration.userservice.UserRole;
import com.kyrylo.thesis.course.repository.CourseRepository;
import com.kyrylo.thesis.course.repository.CourseSkillRepository;
import com.kyrylo.thesis.course.repository.SkillRepository;
import com.kyrylo.thesis.course.repository.UserSkillRepository;
import com.kyrylo.thesis.course.web.dto.CourseSkillRequest;
import com.kyrylo.thesis.course.web.dto.CreateSkillRequest;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class SkillApplicationServiceTest {

    @Mock SkillRepository skillRepository;
    @Mock CourseSkillRepository courseSkillRepository;
    @Mock UserSkillRepository userSkillRepository;
    @Mock CourseRepository courseRepository;
    @Mock UserDirectoryClient userDirectoryClient;

    @InjectMocks
    SkillApplicationService service;

    // ── helpers ───────────────────────────────────────────────────────────────

    private MeContextDto curatorCtx(Long orgId) {
        MeContextDto ctx = new MeContextDto();
        ctx.setRole(UserRole.CURATOR);
        OrganizationContextDto o = new OrganizationContextDto();
        o.setOrganizationId(orgId);
        o.setMemberKind(OrganizationMemberKind.CURATOR);
        ctx.setOrganizations(List.of(o));
        return ctx;
    }

    private MeContextDto learnerCtx() {
        MeContextDto ctx = new MeContextDto();
        ctx.setRole(UserRole.LEARNER);
        ctx.setOrganizations(List.of());
        return ctx;
    }

    // ── listSkills ────────────────────────────────────────────────────────────

    @Test
    void listSkills_returnsMappedList() {
        Skill s = Skill.builder().id(1L).name("Java").category(SkillCategory.BACKEND).build();
        when(skillRepository.findAllByOrderByNameAsc()).thenReturn(List.of(s));

        var list = service.listSkills();
        assertEquals(1, list.size());
        assertEquals("Java", list.get(0).getName());
        assertEquals(SkillCategory.BACKEND, list.get(0).getCategory());
    }

    // ── createSkill ───────────────────────────────────────────────────────────

    @Test
    void createSkill_success() {
        when(userDirectoryClient.fetchMeContext(any())).thenReturn(curatorCtx(10L));
        when(skillRepository.findByNameIgnoreCase("Java")).thenReturn(Optional.empty());

        Skill saved = Skill.builder().id(1L).name("Java").category(SkillCategory.BACKEND).build();
        when(skillRepository.save(any())).thenReturn(saved);

        CreateSkillRequest req = new CreateSkillRequest();
        req.setName("Java");
        req.setCategory(SkillCategory.BACKEND);

        var resp = service.createSkill("auth", req);
        assertEquals(1L, resp.getId());
        assertEquals("Java", resp.getName());
    }

    @Test
    void createSkill_duplicate_throws409() {
        when(userDirectoryClient.fetchMeContext(any())).thenReturn(curatorCtx(10L));
        when(skillRepository.findByNameIgnoreCase("Java"))
                .thenReturn(Optional.of(Skill.builder().id(1L).name("Java").build()));

        CreateSkillRequest req = new CreateSkillRequest();
        req.setName("Java");
        req.setCategory(SkillCategory.BACKEND);

        assertThrows(ResponseStatusException.class, () -> service.createSkill("auth", req));
    }

    @Test
    void createSkill_notCurator_throws403() {
        when(userDirectoryClient.fetchMeContext(any())).thenReturn(learnerCtx());

        CreateSkillRequest req = new CreateSkillRequest();
        req.setName("Java");
        req.setCategory(SkillCategory.BACKEND);

        assertThrows(ResponseStatusException.class, () -> service.createSkill("auth", req));
    }

    // ── getCourseSkills ───────────────────────────────────────────────────────

    @Test
    void getCourseSkills_returnsMappedList() {
        Skill skill = Skill.builder().id(1L).name("Docker").category(SkillCategory.DEVOPS).build();
        Course course = Course.builder().id(1L).organizationId(10L).title("C").status(CourseStatus.PUBLISHED).build();
        CourseSkill cs = CourseSkill.builder().skill(skill).course(course).skillLevel(SkillLevel.MIDDLE).build();

        when(courseSkillRepository.findByCourseIdWithSkill(1L)).thenReturn(List.of(cs));

        var list = service.getCourseSkills(1L);
        assertEquals(1, list.size());
        assertEquals("Docker", list.get(0).getSkillName());
        assertEquals(SkillLevel.MIDDLE, list.get(0).getSkillLevel());
    }

    // ── setCourseSkills ───────────────────────────────────────────────────────

    @Test
    void setCourseSkills_success_replacesAll() {
        Course course = Course.builder().id(1L).organizationId(10L).title("C").status(CourseStatus.PUBLISHED).build();
        Skill skill = Skill.builder().id(5L).name("K8s").category(SkillCategory.DEVOPS).build();

        when(userDirectoryClient.fetchMeContext(any())).thenReturn(curatorCtx(10L));
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(skillRepository.findById(5L)).thenReturn(Optional.of(skill));

        CourseSkill newCs = CourseSkill.builder().skill(skill).course(course).skillLevel(SkillLevel.SENIOR).build();
        when(courseSkillRepository.findByCourseIdWithSkill(1L)).thenReturn(List.of(newCs));

        CourseSkillRequest req = new CourseSkillRequest();
        req.setSkillId(5L);
        req.setSkillLevel(SkillLevel.SENIOR);

        var result = service.setCourseSkills("auth", 1L, List.of(req));
        assertEquals(1, result.size());
        assertEquals(SkillLevel.SENIOR, result.get(0).getSkillLevel());
        verify(courseSkillRepository).deleteByCourseId(1L);
        verify(courseSkillRepository).saveAll(any());
    }

    @Test
    void setCourseSkills_notCurator_throws403() {
        Course course = Course.builder().id(1L).organizationId(10L).title("C").status(CourseStatus.PUBLISHED).build();
        when(userDirectoryClient.fetchMeContext(any())).thenReturn(learnerCtx());
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));

        assertThrows(ResponseStatusException.class,
                () -> service.setCourseSkills("auth", 1L, List.of()));
    }

    // ── awardSkillsForCompletedCourse ─────────────────────────────────────────

    @Test
    void awardSkills_noSkillsOnCourse_doesNothing() {
        when(courseSkillRepository.findByCourseIdWithSkill(1L)).thenReturn(List.of());
        service.awardSkillsForCompletedCourse(5L, 1L);
        verify(userSkillRepository, never()).save(any());
    }

    @Test
    void awardSkills_newSkill_created() {
        Skill skill = Skill.builder().id(1L).name("Java").category(SkillCategory.BACKEND).build();
        Course course = Course.builder().id(1L).organizationId(10L).title("C").status(CourseStatus.PUBLISHED).build();
        CourseSkill cs = CourseSkill.builder().skill(skill).course(course).skillLevel(SkillLevel.MIDDLE).build();

        when(courseSkillRepository.findByCourseIdWithSkill(1L)).thenReturn(List.of(cs));
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(userSkillRepository.findByUserIdAndSkillId(5L, 1L)).thenReturn(Optional.empty());

        service.awardSkillsForCompletedCourse(5L, 1L);

        verify(userSkillRepository).save(argThat(us ->
                us.getSkillLevel() == SkillLevel.MIDDLE && us.getUserId() == 5L));
    }

    @Test
    void awardSkills_existingLowerLevel_upgrades() {
        Skill skill = Skill.builder().id(1L).name("Java").category(SkillCategory.BACKEND).build();
        Course course = Course.builder().id(1L).organizationId(10L).title("C").status(CourseStatus.PUBLISHED).build();
        CourseSkill cs = CourseSkill.builder().skill(skill).course(course).skillLevel(SkillLevel.SENIOR).build();

        UserSkill existing = UserSkill.builder().userId(5L).skill(skill).skillLevel(SkillLevel.TRAINEE).build();

        when(courseSkillRepository.findByCourseIdWithSkill(1L)).thenReturn(List.of(cs));
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(userSkillRepository.findByUserIdAndSkillId(5L, 1L)).thenReturn(Optional.of(existing));

        service.awardSkillsForCompletedCourse(5L, 1L);

        verify(userSkillRepository).save(argThat(us -> us.getSkillLevel() == SkillLevel.SENIOR));
    }

    @Test
    void awardSkills_existingHigherLevel_doesNotDowngrade() {
        Skill skill = Skill.builder().id(1L).name("Java").category(SkillCategory.BACKEND).build();
        Course course = Course.builder().id(1L).organizationId(10L).title("C").status(CourseStatus.PUBLISHED).build();
        CourseSkill cs = CourseSkill.builder().skill(skill).course(course).skillLevel(SkillLevel.TRAINEE).build();

        UserSkill existing = UserSkill.builder().userId(5L).skill(skill).skillLevel(SkillLevel.SENIOR).build();

        when(courseSkillRepository.findByCourseIdWithSkill(1L)).thenReturn(List.of(cs));
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(userSkillRepository.findByUserIdAndSkillId(5L, 1L)).thenReturn(Optional.of(existing));

        service.awardSkillsForCompletedCourse(5L, 1L);

        verify(userSkillRepository, never()).save(any());
    }

    // ── getUserSkills ─────────────────────────────────────────────────────────

    @Test
    void getUserSkills_returnsMappedList() {
        Skill skill = Skill.builder().id(1L).name("Java").category(SkillCategory.BACKEND).build();
        Course course = Course.builder().id(1L).organizationId(10L).title("C").status(CourseStatus.PUBLISHED).build();
        UserSkill us = UserSkill.builder().userId(5L).skill(skill).skillLevel(SkillLevel.MIDDLE).course(course).build();

        when(userSkillRepository.findByUserIdWithDetails(5L)).thenReturn(List.of(us));

        var list = service.getUserSkills(5L);
        assertEquals(1, list.size());
        assertEquals("Java", list.get(0).getSkillName());
        assertEquals(SkillLevel.MIDDLE, list.get(0).getSkillLevel());
        assertEquals(1L, list.get(0).getCourseId());
    }
}
