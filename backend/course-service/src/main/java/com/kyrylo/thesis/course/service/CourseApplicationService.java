package com.kyrylo.thesis.course.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kyrylo.thesis.course.domain.Course;
import com.kyrylo.thesis.course.domain.CourseModule;
import com.kyrylo.thesis.course.domain.Lesson;
import com.kyrylo.thesis.course.repository.CourseRepository;
import com.kyrylo.thesis.course.web.dto.CourseModuleResponse;
import com.kyrylo.thesis.course.web.dto.CourseResponse;
import com.kyrylo.thesis.course.web.dto.CourseSummaryResponse;
import com.kyrylo.thesis.course.web.dto.CreateCourseRequest;
import com.kyrylo.thesis.course.web.dto.CreateLessonRequest;
import com.kyrylo.thesis.course.web.dto.CreateModuleRequest;
import com.kyrylo.thesis.course.web.dto.LessonResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CourseApplicationService {

    private final CourseRepository courseRepository;

    @Transactional
    public CourseResponse createCourse(CreateCourseRequest request) {
        Course course = Course.builder()
                .title(request.getTitle().trim())
                .description(trimToNull(request.getDescription()))
                .status(request.getStatus())
                .build();
        appendModules(course, request.getModules());
        Course saved = courseRepository.save(course);
        return toResponse(requireWithStructure(saved.getId()));
    }

    @Transactional(readOnly = true)
    public List<CourseSummaryResponse> listCourses() {
        return courseRepository.findAll().stream()
                .map(c -> CourseSummaryResponse.builder()
                        .id(c.getId())
                        .title(c.getTitle())
                        .status(c.getStatus())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public CourseResponse getCourse(Long id) {
        return toResponse(requireWithStructure(id));
    }

    @Transactional
    public CourseResponse updateCourse(Long id, CreateCourseRequest request) {
        Course course = courseRepository.findByIdWithStructure(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        course.setTitle(request.getTitle().trim());
        course.setDescription(trimToNull(request.getDescription()));
        course.setStatus(request.getStatus());
        course.clearModules();
        appendModules(course, request.getModules());
        courseRepository.save(course);
        return toResponse(requireWithStructure(id));
    }

    @Transactional
    public void deleteCourse(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        courseRepository.deleteById(id);
    }

    private Course requireWithStructure(Long id) {
        return courseRepository.findByIdWithStructure(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private void appendModules(Course course, List<CreateModuleRequest> moduleRequests) {
        for (CreateModuleRequest mr : moduleRequests) {
            CourseModule module = CourseModule.builder()
                    .name(mr.getName().trim())
                    .sortOrder(mr.getSortOrder())
                    .build();
            for (CreateLessonRequest lr : mr.getLessons()) {
                Lesson lesson = Lesson.builder()
                        .title(lr.getTitle().trim())
                        .content(lr.getContent())
                        .build();
                module.addLesson(lesson);
            }
            course.addModule(module);
        }
    }

    private CourseResponse toResponse(Course course) {
        List<CourseModuleResponse> modules = course.getModules().stream()
                .map(m -> CourseModuleResponse.builder()
                        .id(m.getId())
                        .name(m.getName())
                        .sortOrder(m.getSortOrder())
                        .lessons(m.getLessons().stream()
                                .map(l -> LessonResponse.builder()
                                        .id(l.getId())
                                        .title(l.getTitle())
                                        .content(l.getContent())
                                        .hasQuiz(l.getQuiz() != null)
                                        .build())
                                .toList())
                        .build())
                .toList();

        return CourseResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .description(course.getDescription())
                .status(course.getStatus())
                .modules(modules)
                .build();
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }
}
