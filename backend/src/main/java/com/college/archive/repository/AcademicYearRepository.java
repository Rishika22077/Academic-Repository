package com.college.archive.repository;

import com.college.archive.entity.AcademicYear;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AcademicYearRepository extends JpaRepository<AcademicYear, Long> {
    boolean existsByLabel(String label);
    boolean existsByLabelAndIdNot(String label, Long id);
}
