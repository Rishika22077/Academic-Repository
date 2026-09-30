package com.college.archive.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Set;

/** JSON part ("data") of the multipart project submission. The PDF is the separate "report" part. */
public record ProjectRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 255, message = "Title must be at most 255 characters")
        String title,

        @NotBlank(message = "Abstract is required")
        @Size(min = 30, max = 5000, message = "Abstract must be 30 to 5000 characters")
        String abstractText,

        @NotBlank(message = "Department is required")
        @Size(max = 100)
        String department,

        @NotNull(message = "Category is required") Long categoryId,
        @NotNull(message = "Academic year is required") Long academicYearId,
        @NotNull(message = "Faculty guide is required") Long facultyId,

        /** Other team members (registered students). The submitter is added automatically. */
        Set<Long> memberIds,

        @NotEmpty(message = "Add at least one keyword")
        @Size(max = 15, message = "At most 15 keywords are allowed")
        List<String> keywords,

        @NotEmpty(message = "Add at least one technology")
        @Size(max = 15, message = "At most 15 technologies are allowed")
        List<String> technologies,

        /** Optional. */
        @Size(max = 500) String githubUrl
) {}
