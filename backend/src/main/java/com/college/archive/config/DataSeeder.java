package com.college.archive.config;

import com.college.archive.entity.AcademicYear;
import com.college.archive.entity.Category;
import com.college.archive.entity.Role;
import com.college.archive.entity.User;
import com.college.archive.repository.AcademicYearRepository;
import com.college.archive.repository.CategoryRepository;
import com.college.archive.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/** Runs on startup and creates the first admin, a demo faculty, categories and academic years if missing. */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final AcademicYearRepository academicYearRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin-email}") private String adminEmail;
    @Value("${app.seed.admin-password}") private String adminPassword;
    @Value("${app.seed.faculty-email}") private String facultyEmail;
    @Value("${app.seed.faculty-password}") private String facultyPassword;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByRole(Role.ADMIN)) {
            createUser("Administrator", adminEmail, adminPassword, Role.ADMIN);
        }
        if (!userRepository.existsByEmail(facultyEmail)) {
            createUser("Demo Faculty", facultyEmail, facultyPassword, Role.FACULTY);
        }

        if (categoryRepository.count() == 0) {
            List.of("Cybersecurity", "AI & DS", "Data Science")
                    .forEach(name -> categoryRepository.save(new Category(name)));
        }

        if (academicYearRepository.count() == 0) {
            List.of("2024-25", "2025-26", "2026-27")
                    .forEach(label -> academicYearRepository.save(new AcademicYear(label)));
        }
    }

    private void createUser(String name, String email, String rawPassword, Role role) {
        User u = new User();
        u.setName(name);
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(rawPassword));
        u.setRole(role);
        u.setActive(true);
        userRepository.save(u);
    }
}
