package com.kyrylo.thesis.course.web;

import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.kyrylo.thesis.course.service.MediaStorageService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaStorageService mediaStorageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MediaUploadResponse> upload(@RequestParam("file") MultipartFile file) {
        String mediaId = mediaStorageService.save(file);
        return ResponseEntity.ok(new MediaUploadResponse(mediaId, "/api/media/" + mediaId));
    }

    @GetMapping("/{mediaId}")
    public ResponseEntity<Resource> download(@PathVariable String mediaId) {
        Resource resource = mediaStorageService.load(mediaId);
        return ResponseEntity.ok().body(resource);
    }

    public record MediaUploadResponse(String mediaId, String url) {
    }
}
