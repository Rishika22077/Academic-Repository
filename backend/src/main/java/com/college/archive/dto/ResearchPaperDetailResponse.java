package com.college.archive.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ResearchPaperDetailResponse(
        Long id,
        String title,
        String authors,
        String abstractText,
        String department,
        String category,
        String academicYear,
        PersonDto faculty,
        PersonDto submittedBy,
        String affiliation,
        String venue,
        Integer publicationYear,
        String doi,
        String doiUrl,
        String externalUrl,
        List<String> keywords,
        List<String> researchAreas,
        String reportUrl,
        String originalReportName,
        String status,
        String rejectionReason,
        LocalDateTime submittedAt,
        LocalDateTime approvedAt
) {}
