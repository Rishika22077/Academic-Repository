package com.college.archive.service;

import com.college.archive.dto.AdminStats;
import com.college.archive.entity.Role;
import com.college.archive.entity.SubmissionStatus;
import com.college.archive.repository.ProjectRepository;
import com.college.archive.repository.ResearchPaperRepository;
import com.college.archive.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

/** Counts for the admin dashboard. */
@Service
@RequiredArgsConstructor
public class AdminStatsService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ResearchPaperRepository paperRepository;

    @Transactional(readOnly = true)
    public AdminStats stats() {
        Map<String, Long> projects = new LinkedHashMap<>();
        Map<String, Long> papers = new LinkedHashMap<>();
        for (SubmissionStatus s : SubmissionStatus.values()) {
            projects.put(s.name(), projectRepository.countByStatus(s));
            papers.put(s.name(), paperRepository.countByStatus(s));
        }
        return new AdminStats(
                userRepository.countByRole(Role.STUDENT),
                userRepository.countByRole(Role.FACULTY),
                userRepository.countByRole(Role.ADMIN),
                projects, papers);
    }
}
