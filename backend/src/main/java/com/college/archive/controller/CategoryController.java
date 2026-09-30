package com.college.archive.controller;

import com.college.archive.dto.CategoryRequest;
import com.college.archive.dto.LookupDto;
import com.college.archive.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Write operations for categories (admin only). GET /api/categories lives in LookupController. */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    public ResponseEntity<LookupDto> create(@Valid @RequestBody CategoryRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.create(body.name()));
    }

    @PutMapping("/{id}")
    public LookupDto update(@PathVariable Long id, @Valid @RequestBody CategoryRequest body) {
        return categoryService.update(id, body.name());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
