package com.kyrylo.thesis.course.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.kyrylo.thesis.course.service.CourseApplicationService;

import jakarta.servlet.http.HttpServletRequest;
import com.kyrylo.thesis.course.web.dto.CourseResponse;
import com.kyrylo.thesis.course.web.dto.CourseSummaryResponse;
import com.kyrylo.thesis.course.web.dto.CreateCourseRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseApplicationService courseApplicationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CourseResponse createCourse(
            HttpServletRequest httpRequest,
            @Valid @RequestBody CreateCourseRequest request) {
        return courseApplicationService.createCourse(bearer(httpRequest), request);
    }

    @GetMapping
    public List<CourseSummaryResponse> listCourses(HttpServletRequest httpRequest) {
        return courseApplicationService.listCourses(bearer(httpRequest));
    }

    @GetMapping("/{id}")
    public CourseResponse getCourse(HttpServletRequest httpRequest, @PathVariable Long id) {
        return courseApplicationService.getCourse(bearer(httpRequest), id);
    }

    @PutMapping("/{id}")
    public CourseResponse updateCourse(
            HttpServletRequest httpRequest,
            @PathVariable Long id,
            @Valid @RequestBody CreateCourseRequest request) {
        return courseApplicationService.updateCourse(bearer(httpRequest), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCourse(HttpServletRequest httpRequest, @PathVariable Long id) {
        courseApplicationService.deleteCourse(bearer(httpRequest), id);
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
