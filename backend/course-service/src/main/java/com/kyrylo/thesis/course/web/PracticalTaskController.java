package com.kyrylo.thesis.course.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kyrylo.thesis.course.security.SecurityUserPrincipal;
import com.kyrylo.thesis.course.service.PracticalTaskApplicationService;
import com.kyrylo.thesis.course.web.dto.PendingTaskSubmissionResponse;
import com.kyrylo.thesis.course.web.dto.ReviewTaskSubmissionRequest;
import com.kyrylo.thesis.course.web.dto.SubmitTaskRequest;
import com.kyrylo.thesis.course.web.dto.TaskSubmissionResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class PracticalTaskController {

    private final PracticalTaskApplicationService practicalTaskApplicationService;

    @PostMapping("/{taskId}/submit")
    public TaskSubmissionResponse submitTask(
            HttpServletRequest httpRequest,
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @PathVariable Long taskId,
            @Valid @RequestBody SubmitTaskRequest request) {
        return practicalTaskApplicationService.submitTask(bearer(httpRequest), principal.userId(), taskId, request);
    }

    @GetMapping("/submissions/pending")
    public List<PendingTaskSubmissionResponse> getPendingSubmissions(
            HttpServletRequest httpRequest) {
        return practicalTaskApplicationService.getPendingSubmissions(bearer(httpRequest));
    }

    @PostMapping("/submissions/{submissionId}/review")
    public TaskSubmissionResponse reviewSubmission(
            HttpServletRequest httpRequest,
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @PathVariable Long submissionId,
            @Valid @RequestBody ReviewTaskSubmissionRequest request) {
        return practicalTaskApplicationService.reviewSubmission(bearer(httpRequest), submissionId, principal.userId(), request);
    }
    
    @GetMapping("/{taskId}/my-submission")
    public TaskSubmissionResponse getMySubmission(
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @PathVariable Long taskId) {
        return practicalTaskApplicationService.getMySubmission(principal.userId(), taskId);
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
