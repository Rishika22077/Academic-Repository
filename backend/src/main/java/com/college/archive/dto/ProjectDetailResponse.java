package com.college.archive.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ProjectDetailResponse(
        Long id,
        String title,
        String abstractText,
        String department,
        String category,
        String academicYear,
        PersonDto faculty,
        PersonDto submittedBy,
        List<PersonDto> members,
        List<String> keywords,
        List<String> technologies,
        String githubUrl,
        String reportUrl,
        String originalReportName,
        String status,
        String rejectionReason,
        LocalDateTime submittedAt,
        LocalDateTime approvedAt
) {}
