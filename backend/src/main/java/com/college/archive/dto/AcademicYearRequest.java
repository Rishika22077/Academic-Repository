package com.college.archive.dto;

import jakarta.validation.constraints.NotBlank;

/** label like "2025-26". */
public record AcademicYearRequest(@NotBlank(message = "Academic year is required") String label) {}
