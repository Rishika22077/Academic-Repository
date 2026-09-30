package com.college.archive.service;

import com.college.archive.exception.BadRequestException;
import com.college.archive.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.UUID;

/**
 * Stores uploaded PDF reports on disk. Only a relative path such as "projects/3f2a...pdf"
 * goes into PostgreSQL. The user's file name is never used on disk (random UUID instead),
 * which prevents path-traversal and overwrite tricks.
 */
@Service
public class FileStorageService {

    private static final long MAX_SIZE_BYTES = 10L * 1024 * 1024;   // 10 MB
    private static final byte[] PDF_MAGIC = "%PDF-".getBytes(StandardCharsets.US_ASCII);

    private final Path root;

    public FileStorageService(@Value("${app.upload-dir}") String uploadDir) throws IOException {
        this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(root);
    }

    /** Validates and stores the PDF. Returns the relative path to save in the database. */
    public String store(MultipartFile file, String folder) {
        validate(file);
        try {
            Path dir = root.resolve(folder).normalize();
            Files.createDirectories(dir);
            String storedName = UUID.randomUUID() + ".pdf";
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, dir.resolve(storedName));
            }
            return folder + "/" + storedName;
        } catch (IOException e) {
            throw new UncheckedIOException("Could not store the uploaded file", e);
        }
    }

    public Resource load(String relativePath) {
        Path path = resolveSafely(relativePath);
        if (path == null || !Files.isReadable(path)) {
            throw new ResourceNotFoundException("Report file not found");
        }
        return new FileSystemResource(path);
    }

    /** Best-effort delete; a missing file is not an error. */
    public void delete(String relativePath) {
        try {
            Path path = resolveSafely(relativePath);
            if (path != null) Files.deleteIfExists(path);
        } catch (IOException ignored) {
            // leave the orphan file rather than fail the request
        }
    }

    /** The original file name, cleaned up for display and for the download header only. */
    public String displayName(MultipartFile file) {
        String name = file.getOriginalFilename();
        if (name == null || name.isBlank()) return "report.pdf";
        name = name.replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1);
        name = name.replaceAll("[\\p{Cntrl}\"]", "").trim();
        if (name.isEmpty()) return "report.pdf";
        return name.length() > 200 ? name.substring(name.length() - 200) : name;
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("A PDF report is required");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new BadRequestException("File is too large (maximum 10 MB)");
        }
        String original = file.getOriginalFilename();
        if (original == null || !original.toLowerCase().endsWith(".pdf")) {
            throw new BadRequestException("Only PDF files are allowed");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equalsIgnoreCase("application/pdf")) {
            throw new BadRequestException("Only PDF files are allowed");
        }
        // The extension and content type come from the client, so also check the real file signature.
        try (InputStream in = file.getInputStream()) {
            byte[] head = in.readNBytes(PDF_MAGIC.length);
            if (!Arrays.equals(head, PDF_MAGIC)) {
                throw new BadRequestException("The uploaded file is not a valid PDF");
            }
        } catch (IOException e) {
            throw new UncheckedIOException("Could not read the uploaded file", e);
        }
    }

    private Path resolveSafely(String relativePath) {
        if (relativePath == null || relativePath.isBlank()) return null;
        Path path = root.resolve(relativePath).normalize();
        return path.startsWith(root) ? path : null;   // refuse anything that escapes the upload folder
    }
}
