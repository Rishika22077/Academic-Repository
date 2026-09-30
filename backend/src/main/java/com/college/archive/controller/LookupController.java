package com.college.archive.controller;

import com.college.archive.dto.LookupDto;
import com.college.archive.dto.PersonDto;
import com.college.archive.dto.StudentLookupDto;
import com.college.archive.entity.TagType;
import com.college.archive.exception.BadRequestException;
import com.college.archive.service.LookupService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Dropdown data for the React forms and search filters. Categories/years are never hard-coded in the frontend. */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LookupController {

    private final LookupService lookupService;

    @GetMapping("/categories")
    public List<LookupDto> categories() {
        return lookupService.categories();
    }

    @GetMapping("/academic-years")
    public List<LookupDto> academicYears() {
        return lookupService.academicYears();
    }

    @GetMapping("/users/faculty")
    public List<PersonDto> faculty() {
        return lookupService.activeFaculty();
    }

    @GetMapping("/users/students")
    @PreAuthorize("hasRole('STUDENT')")
    public List<StudentLookupDto> students(@RequestParam String q) {
        return lookupService.findStudents(q);
    }

    /** Names used by approved items, for the "Technology / Research Area" filter. type = TECHNOLOGY | KEYWORD */
    @GetMapping("/tags")
    public List<String> tags(@RequestParam(defaultValue = "TECHNOLOGY") String type) {
        try {
            return lookupService.approvedTagNames(TagType.valueOf(type.trim().toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("type must be TECHNOLOGY or KEYWORD");
        }
    }
}
