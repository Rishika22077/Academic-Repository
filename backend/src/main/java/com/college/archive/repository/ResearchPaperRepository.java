package com.college.archive.repository;

import com.college.archive.entity.ResearchPaper;
import com.college.archive.entity.SubmissionStatus;
import com.college.archive.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Collection;
import java.util.List;

public interface ResearchPaperRepository extends JpaRepository<ResearchPaper, Long>, JpaSpecificationExecutor<ResearchPaper> {

    List<ResearchPaper> findBySubmittedByOrderBySubmittedAtDesc(User student);

    List<ResearchPaper> findByFacultyAndStatusInOrderBySubmittedAtDesc(User faculty, Collection<SubmissionStatus> statuses);

    List<ResearchPaper> findByStatusOrderBySubmittedAtDesc(SubmissionStatus status);

    boolean existsByCategoryId(Long categoryId);
    boolean existsByAcademicYearId(Long academicYearId);
    long countByStatus(SubmissionStatus status);
}
