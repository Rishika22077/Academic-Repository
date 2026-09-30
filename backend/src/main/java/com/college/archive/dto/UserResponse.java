package com.college.archive.dto;

import com.college.archive.entity.User;

import java.time.LocalDateTime;

/** Safe view of a user - never includes the password hash. */
public record UserResponse(Long id, String name, String email, String role, boolean active, LocalDateTime createdAt) {
    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getName(), u.getEmail(), u.getRole().name(), u.isActive(), u.getCreatedAt());
    }
}
