package com.college.archive.controller;

import com.college.archive.dto.AcademicYearRequest;
import com.college.archive.dto.LookupDto;
import com.college.archive.service.AcademicYearService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Write operations for academic years (admin only). GET /api/academic-years lives in LookupController. */
@RestController
@RequestMapping("/api/academic-years")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AcademicYearController {

    private final AcademicYearService academicYearService;

    @PostMapping
    public ResponseEntity<LookupDto> create(@Valid @RequestBody AcademicYearRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(academicYearService.create(body.label()));
    }

    @PutMapping("/{id}")
    public LookupDto update(@PathVariable Long id, @Valid @RequestBody AcademicYearRequest body) {
        return academicYearService.update(id, body.label());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        academicYearService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
