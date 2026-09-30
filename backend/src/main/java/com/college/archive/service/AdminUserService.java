package com.college.archive.service;

import com.college.archive.dto.*;
import com.college.archive.entity.Role;
import com.college.archive.entity.User;
import com.college.archive.exception.BadRequestException;
import com.college.archive.exception.ConflictException;
import com.college.archive.exception.ResourceNotFoundException;
import com.college.archive.repository.UserRepository;
import com.college.archive.search.SpecUtils;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Account management for admins. Accounts are never deleted (submissions reference them);
 * they are deactivated instead, which blocks login immediately.
 */
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> list(Role role, Boolean active, String q, int page, int size) {
        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (role != null) ps.add(cb.equal(root.get("role"), role));
            if (active != null) ps.add(cb.equal(root.get("active"), active));
            for (String token : SpecUtils.tokens(q)) {
                String pat = SpecUtils.pattern(token);
                ps.add(cb.or(SpecUtils.like(cb, root.<String>get("name"), pat),
                             SpecUtils.like(cb, root.<String>get("email"), pat)));
            }
            return cb.and(ps.toArray(new Predicate[0]));
        };
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.from(userRepository.findAll(spec, pageable).map(UserResponse::from));
    }

    @Transactional
    public UserResponse create(CreateUserRequest req) {
        String email = normalizeEmail(req.email());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("An account with this email already exists");
        }
        User user = new User();
        user.setName(req.name().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setRole(req.role());
        user.setActive(true);
        return UserResponse.from(userRepository.save(user));
    }

    /**
     * Name and email only. The role is fixed once an account exists, because a role change would
     * orphan the user's submissions or review assignments.
     * Note: the login token is tied to the email, so a user whose email changes must log in again.
     */
    @Transactional
    public UserResponse update(Long id, UpdateUserRequest req) {
        User user = find(id);
        String email = normalizeEmail(req.email());
        if (!email.equals(user.getEmail()) && userRepository.existsByEmail(email)) {
            throw new ConflictException("An account with this email already exists");
        }
        user.setName(req.name().trim());
        user.setEmail(email);
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse setActive(Long id, boolean active, User actor) {
        User user = find(id);
        if (!active && user.getId().equals(actor.getId())) {
            throw new BadRequestException("You cannot deactivate your own account");
        }
        user.setActive(active);
        return UserResponse.from(user);
    }

    @Transactional
    public void resetPassword(Long id, String newPassword) {
        User user = find(id);
        user.setPassword(passwordEncoder.encode(newPassword));
    }

    private User find(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
