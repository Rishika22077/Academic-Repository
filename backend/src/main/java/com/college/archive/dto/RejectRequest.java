package com.college.archive.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectRequest(
        @NotBlank(message = "A rejection reason is required")
        @Size(max = 2000, message = "Rejection reason must be at most 2000 characters")
        String reason
) {}
