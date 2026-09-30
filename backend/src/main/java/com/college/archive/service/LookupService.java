package com.college.archive.service;

import com.college.archive.dto.LookupDto;
import com.college.archive.dto.PersonDto;
import com.college.archive.dto.StudentLookupDto;
import com.college.archive.entity.Role;
import com.college.archive.entity.TagType;
import com.college.archive.entity.User;
import com.college.archive.repository.AcademicYearRepository;
import com.college.archive.repository.CategoryRepository;
import com.college.archive.repository.TagRepository;
import com.college.archive.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

/** Read-only data for dropdowns and pickers in the React forms and filters. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LookupService {

    private final CategoryRepository categoryRepository;
    private final AcademicYearRepository academicYearRepository;
    private final UserRepository userRepository;
    private final TagRepository tagRepository;

    public List<LookupDto> categories() {
        return categoryRepository.findAll(Sort.by("name")).stream()
                .map(c -> new LookupDto(c.getId(), c.getName())).toList();
    }

    public List<LookupDto> academicYears() {
        return academicYearRepository.findAll(Sort.by(Sort.Direction.DESC, "label")).stream()
                .map(y -> new LookupDto(y.getId(), y.getLabel())).toList();
    }

    public List<PersonDto> activeFaculty() {
        return userRepository.findByRoleAndActiveTrue(Role.FACULTY).stream()
                .sorted(Comparator.comparing(User::getName, String.CASE_INSENSITIVE_ORDER))
                .map(u -> new PersonDto(u.getId(), u.getName())).toList();
    }

    /** Student picker for team members. Needs at least 2 characters so the list cannot be dumped. */
    public List<StudentLookupDto> findStudents(String q) {
        if (q == null || q.trim().length() < 2) return List.of();
        String needle = q.trim().toLowerCase();
        return userRepository.findByRoleAndActiveTrue(Role.STUDENT).stream()
                .filter(u -> u.getName().toLowerCase().contains(needle) || u.getEmail().toLowerCase().contains(needle))
                .sorted(Comparator.comparing(User::getName, String.CASE_INSENSITIVE_ORDER))
                .limit(20)
                .map(u -> new StudentLookupDto(u.getId(), u.getName(), u.getEmail())).toList();
    }

    public List<String> approvedTagNames(TagType type) {
        return tagRepository.findApprovedTagNames(type);
    }
}
