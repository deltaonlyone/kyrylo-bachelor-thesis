package com.kyrylo.thesis.course.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.kyrylo.thesis.course.security.SecurityUserPrincipal;
import com.kyrylo.thesis.course.service.EnrollmentApplicationService;
import com.kyrylo.thesis.course.web.dto.CourseProgressResponse;
import com.kyrylo.thesis.course.web.dto.EnrollmentResponse;
import com.kyrylo.thesis.course.web.dto.EnrollLearnerRequest;
import com.kyrylo.thesis.course.web.dto.StudentProgressResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentApplicationService enrollmentService;

    /**
     * POST /api/enrollments/{courseId} — самозапис слухача (userId з JWT).
     */
    @PostMapping("/{courseId}")
    @ResponseStatus(HttpStatus.CREATED)
    public EnrollmentResponse enrollSelf(
            HttpServletRequest httpRequest,
            @PathVariable Long courseId) {
        return enrollmentService.enrollSelf(bearer(httpRequest), courseId);
    }

    /**
     * POST /api/enrollments/{courseId}/learners — запис слухача викладачем/куратором.
     */
    @PostMapping("/{courseId}/learners")
    @ResponseStatus(HttpStatus.CREATED)
    public EnrollmentResponse enrollLearner(
            HttpServletRequest httpRequest,
            @PathVariable Long courseId,
            @Valid @RequestBody EnrollLearnerRequest body) {
        return enrollmentService.enrollLearnerByEducator(
                bearer(httpRequest), courseId, body.getLearnerUserId());
    }

    /**
     * GET /api/enrollments/my — усі записи поточного слухача.
     */
    @GetMapping("/my")
    public List<EnrollmentResponse> myEnrollments(@AuthenticationPrincipal SecurityUserPrincipal principal) {
        return enrollmentService.getMyEnrollments(principal.userId());
    }

    /**
     * DELETE /api/enrollments/{courseId}/learners/{userId} — відрахування слухача (Educator/Curator).
     */
    @DeleteMapping("/{courseId}/learners/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unenrollLearner(
            HttpServletRequest httpRequest,
            @PathVariable Long courseId,
            @PathVariable Long userId) {
        enrollmentService.unenrollLearner(bearer(httpRequest), courseId, userId);
    }

    /**
     * GET /api/enrollments/students/{courseId} — список студентів курсу (куратор / викладач).
     */
    @GetMapping("/students/{courseId}")
    public List<StudentProgressResponse> getStudents(
            HttpServletRequest httpRequest,
            @PathVariable Long courseId) {
        return enrollmentService.getStudentsByCourse(bearer(httpRequest), courseId);
    }

    /**
     * GET /api/enrollments/{courseId}/progress — детальний прогрес слухача по курсу.
     */
    @GetMapping("/{courseId}/progress")
    public CourseProgressResponse getCourseProgress(
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @PathVariable Long courseId) {
        return enrollmentService.getCourseProgress(principal.userId(), courseId);
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
