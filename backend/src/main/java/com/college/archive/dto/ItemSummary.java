package com.college.archive.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * One row in a result list. Used for projects AND research papers so the React
 * search page can render both from a single shape. {@code type} is PROJECT or RESEARCH_PAPER.
 */
public record ItemSummary(
        String type,
        Long id,
        String title,
        String category,
        String academicYear,
        String abstractPreview,
        List<String> people,          // team members (project) or authors (paper)
        List<String> keywords,
        List<String> technologies,    // technologies (project) or research areas (paper)
        String facultyName,
        Integer publicationYear,      // papers only
        String status,
        String rejectionReason,       // only filled for the owner / reviewer / admin lists
        LocalDateTime submittedAt,
        LocalDateTime approvedAt
) {}
