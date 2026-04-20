package com.kyrylo.thesis.course.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import jakarta.annotation.PostConstruct;

@Service
public class MediaStorageService {

    @Value("${app.media.dir:./uploads}")
    private String mediaDir;

    private Path root;

    @PostConstruct
    void init() {
        try {
            root = Path.of(mediaDir).toAbsolutePath().normalize();
            Files.createDirectories(root);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Не вдалося підготувати сховище");
        }
    }

    public String save(MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Файл порожній");
        }
        String ext = extractExtension(file.getOriginalFilename());
        String name = UUID.randomUUID() + ext;
        try {
            Files.copy(file.getInputStream(), root.resolve(name), StandardCopyOption.REPLACE_EXISTING);
            return name;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Не вдалося зберегти файл");
        }
    }

    public Resource load(String mediaId) {
        try {
            Path path = root.resolve(mediaId).normalize();
            if (!path.startsWith(root) || !Files.exists(path)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Файл не знайдено");
            }
            return new UrlResource(path.toUri());
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Файл не знайдено");
        }
    }

    private static String extractExtension(String fileName) {
        if (fileName == null) {
            return "";
        }
        int idx = fileName.lastIndexOf('.');
        return idx >= 0 ? fileName.substring(idx) : "";
    }
}
