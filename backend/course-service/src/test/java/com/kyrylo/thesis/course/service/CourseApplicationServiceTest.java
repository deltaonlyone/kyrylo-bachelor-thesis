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

import com.kyrylo.thesis.course.domain.Course;
import com.kyrylo.thesis.course.domain.CourseStatus;
import com.kyrylo.thesis.course.integration.UserDirectoryClient;
import com.kyrylo.thesis.course.integration.userservice.MeContextDto;
import com.kyrylo.thesis.course.integration.userservice.OrganizationContextDto;
import com.kyrylo.thesis.course.integration.userservice.OrganizationMemberKind;
import com.kyrylo.thesis.course.integration.userservice.UserRole;
import com.kyrylo.thesis.course.repository.CourseRepository;
import com.kyrylo.thesis.course.repository.EnrollmentRepository;
import com.kyrylo.thesis.course.web.dto.CreateCourseRequest;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class CourseApplicationServiceTest {

    @Mock
    CourseRepository courseRepository;

    @Mock
    EnrollmentRepository enrollmentRepository;

    @Mock
    UserDirectoryClient userDirectoryClient;

    @InjectMocks
    CourseApplicationService service;

    @Test
    void listCourses_asSuperCurator_returnsAll() {
        MeContextDto ctx = new MeContextDto();
        ctx.setSuperAdmin(true);
        when(userDirectoryClient.fetchMeContext(any())).thenReturn(ctx);

        Course c1 = Course.builder().id(1L).organizationId(10L).title("A").status(CourseStatus.PUBLISHED).build();
        Course c2 = Course.builder().id(2L).organizationId(11L).title("B").status(CourseStatus.DRAFT).build();
        when(courseRepository.findAll()).thenReturn(List.of(c1, c2));

        var list = service.listCourses("auth");
        assertEquals(2, list.size());
    }

    @Test
    void listCourses_asLearner_returnsEnrolledPublishedOnly() {
        MeContextDto ctx = new MeContextDto();
        ctx.setRole(UserRole.LEARNER);
        ctx.setUserId(5L);
        when(userDirectoryClient.fetchMeContext(any())).thenReturn(ctx);

        Course c1 = Course.builder().id(1L).organizationId(10L).title("A").status(CourseStatus.PUBLISHED).build();
        Course c2 = Course.builder().id(2L).organizationId(10L).title("B").status(CourseStatus.DRAFT).build();

        com.kyrylo.thesis.course.domain.Enrollment e1 = com.kyrylo.thesis.course.domain.Enrollment.builder()
                .id(1L).userId(5L).course(c1).status(com.kyrylo.thesis.course.domain.EnrollmentStatus.ENROLLED).progressPercentage(0).build();
        com.kyrylo.thesis.course.domain.Enrollment e2 = com.kyrylo.thesis.course.domain.Enrollment.builder()
                .id(2L).userId(5L).course(c2).status(com.kyrylo.thesis.course.domain.EnrollmentStatus.ENROLLED).progressPercentage(0).build();

        when(enrollmentRepository.findByUserId(5L)).thenReturn(List.of(e1, e2));
        when(courseRepository.findAllById(List.of(1L, 2L))).thenReturn(List.of(c1, c2));

        var list = service.listCourses("auth");
        // Лише PUBLISHED курс повертається
        assertEquals(1, list.size());
        assertEquals(1L, list.get(0).getId());
    }

    @Test
    void createCourse_authorized_saves_and_returns_response() {
        CreateCourseRequest req = new CreateCourseRequest();
        req.setTitle(" Title ");
        req.setDescription(" desc ");
        req.setStatus(CourseStatus.PUBLISHED);
        req.setOrganizationId(42L);
        req.setModules(List.of());

        MeContextDto ctx = new MeContextDto();
        ctx.setRole(UserRole.CURATOR);
        OrganizationContextDto o = new OrganizationContextDto();
        o.setOrganizationId(42L);
        o.setMemberKind(OrganizationMemberKind.CURATOR);
        ctx.setOrganizations(List.of(o));
        when(userDirectoryClient.fetchMeContext(any())).thenReturn(ctx);

        Course saved = Course.builder().id(100L).organizationId(42L).title("Title").description("desc").status(CourseStatus.PUBLISHED).build();
        when(courseRepository.save(any())).thenReturn(saved);
        when(courseRepository.findByIdWithStructure(100L)).thenReturn(Optional.of(saved));

        var resp = service.createCourse("auth", req);
        assertEquals(100L, resp.getId());
        assertEquals("Title", resp.getTitle());
        assertEquals("desc", resp.getDescription());
    }
}
