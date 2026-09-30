package com.college.archive.controller;

import com.college.archive.dto.AuthResponse;
import com.college.archive.dto.LoginRequest;
import com.college.archive.dto.RegisterRequest;
import com.college.archive.dto.UserResponse;
import com.college.archive.entity.User;
import com.college.archive.exception.ResourceNotFoundException;
import com.college.archive.repository.UserRepository;
import com.college.archive.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    /** Lets the React app restore the logged-in user from a stored token. */
    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return UserResponse.from(user);
    }
}
