package com.college.archive.controller;

import com.college.archive.dto.*;
import com.college.archive.entity.Role;
import com.college.archive.service.AdminStatsService;
import com.college.archive.service.AdminUserService;
import com.college.archive.service.CurrentUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * User management and dashboard numbers. Everything under /api/admin/** is ADMIN-only
 * (enforced in SecurityConfig). Admin views of all projects/papers are in the project and paper controllers.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminUserService userService;
    private final AdminStatsService statsService;
    private final CurrentUserService currentUser;

    @GetMapping("/stats")
    public AdminStats stats() {
        return statsService.stats();
    }

    /** Filters: role=STUDENT|FACULTY|ADMIN, active=true|false, q=name or email text. */
    @GetMapping("/users")
    public PageResponse<UserResponse> users(@RequestParam(required = false) Role role,
                                            @RequestParam(required = false) Boolean active,
                                            @RequestParam(required = false) String q,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size) {
        return userService.list(role, active, q, page, size);
    }

    @PostMapping("/users")
    public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.create(body));
    }

    @PutMapping("/users/{id}")
    public UserResponse update(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest body) {
        return userService.update(id, body);
    }

    @PutMapping("/users/{id}/deactivate")
    public UserResponse deactivate(@PathVariable Long id, Authentication auth) {
        return userService.setActive(id, false, currentUser.get(auth));
    }

    @PutMapping("/users/{id}/activate")
    public UserResponse activate(@PathVariable Long id, Authentication auth) {
        return userService.setActive(id, true, currentUser.get(auth));
    }

    @PutMapping("/users/{id}/password")
    public ResponseEntity<Void> resetPassword(@PathVariable Long id, @Valid @RequestBody ResetPasswordRequest body) {
        userService.resetPassword(id, body.newPassword());
        return ResponseEntity.noContent().build();
    }
}
