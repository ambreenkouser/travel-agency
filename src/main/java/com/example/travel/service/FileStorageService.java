package com.example.travel.service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

    private final Path root = Paths.get("uploads/slips");

    @PostConstruct
    public void init() throws IOException {
        Files.createDirectories(root);
    }

    public String store(Long bookingId, MultipartFile file) throws IOException {
        String ext = StringUtils.getFilenameExtension(file.getOriginalFilename());
        if (ext == null || ext.isBlank()) ext = "jpg";
        String filename = UUID.randomUUID() + "." + ext.toLowerCase();
        Path dir = root.resolve(bookingId.toString());
        Files.createDirectories(dir);
        Files.copy(file.getInputStream(), dir.resolve(filename));
        return "uploads/slips/" + bookingId + "/" + filename;
    }

    public Resource load(String path) {
        return new FileSystemResource(Paths.get(path));
    }
}
