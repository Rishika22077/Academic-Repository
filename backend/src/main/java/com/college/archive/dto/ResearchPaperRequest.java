package com.college.archive.dto;

import jakarta.validation.constraints.*;

import java.util.List;

/** JSON part ("data") of the multipart paper submission. The PDF is the separate "report" part. */
public record ResearchPaperRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 255, message = "Title must be at most 255 characters")
        String title,

        @NotBlank(message = "Authors are required")
        @Size(max = 2000, message = "Authors must be at most 2000 characters")
        String authors,

        @NotBlank(message = "Abstract is required")
        @Size(min = 30, max = 5000, message = "Abstract must be 30 to 5000 characters")
        String abstractText,

        @NotBlank(message = "Department is required")
        @Size(max = 100)
        String department,

        @NotNull(message = "Research category is required") Long categoryId,
        @NotNull(message = "Academic year is required") Long academicYearId,
        @NotNull(message = "Faculty reviewer is required") Long facultyId,

        @Size(max = 255) String affiliation,
        @Size(max = 255) String venue,

        @Min(value = 1900, message = "Publication year looks wrong")
        @Max(value = 2100, message = "Publication year looks wrong")
        Integer publicationYear,

        @Size(max = 255) String doi,
        @Size(max = 500) String externalUrl,

        @NotEmpty(message = "Add at least one keyword")
        @Size(max = 15, message = "At most 15 keywords are allowed")
        List<String> keywords,

        /** Optional research areas, shown/filtered like technologies. */
        @Size(max = 15, message = "At most 15 research areas are allowed")
        List<String> researchAreas
) {}
