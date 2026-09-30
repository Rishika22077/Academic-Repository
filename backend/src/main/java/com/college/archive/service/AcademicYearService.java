package com.college.archive.service;

import com.college.archive.dto.LookupDto;
import com.college.archive.entity.AcademicYear;
import com.college.archive.exception.BadRequestException;
import com.college.archive.exception.ConflictException;
import com.college.archive.exception.ResourceNotFoundException;
import com.college.archive.repository.AcademicYearRepository;
import com.college.archive.repository.ProjectRepository;
import com.college.archive.repository.ResearchPaperRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AcademicYearService {

    private static final Pattern FORMAT = Pattern.compile("(\\d{4})-(\\d{2})");

    private final AcademicYearRepository academicYearRepository;
    private final ProjectRepository projectRepository;
    private final ResearchPaperRepository paperRepository;

    @Transactional
    public LookupDto create(String rawLabel) {
        String label = validate(rawLabel);
        if (academicYearRepository.existsByLabel(label)) {
            throw new ConflictException("Academic year " + label + " already exists");
        }
        AcademicYear saved = academicYearRepository.save(new AcademicYear(label));
        return new LookupDto(saved.getId(), saved.getLabel());
    }

    @Transactional
    public LookupDto update(Long id, String rawLabel) {
        AcademicYear year = find(id);
        String label = validate(rawLabel);
        if (academicYearRepository.existsByLabelAndIdNot(label, id)) {
            throw new ConflictException("Academic year " + label + " already exists");
        }
        year.setLabel(label);
        return new LookupDto(year.getId(), year.getLabel());
    }

    @Transactional
    public void delete(Long id) {
        AcademicYear year = find(id);
        if (projectRepository.existsByAcademicYearId(id) || paperRepository.existsByAcademicYearId(id)) {
            throw new ConflictException("This academic year is used by existing submissions and cannot be deleted");
        }
        academicYearRepository.delete(year);
    }

    private AcademicYear find(Long id) {
        return academicYearRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Academic year not found"));
    }

    /** Accepts "2025-26" only, and checks the second part really is the following year. */
    private String validate(String raw) {
        String label = raw == null ? "" : raw.trim();
        Matcher m = FORMAT.matcher(label);
        if (!m.matches()) {
            throw new BadRequestException("Academic year must look like 2025-26");
        }
        int start = Integer.parseInt(m.group(1));
        int end = Integer.parseInt(m.group(2));
        if ((start + 1) % 100 != end) {
            throw new BadRequestException("The second part must be the year after the first, e.g. 2025-26");
        }
        return label;
    }
}
