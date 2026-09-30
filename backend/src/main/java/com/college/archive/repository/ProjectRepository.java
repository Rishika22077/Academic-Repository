package com.college.archive.repository;

import com.college.archive.entity.Project;
import com.college.archive.entity.SubmissionStatus;
import com.college.archive.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long>, JpaSpecificationExecutor<Project> {

    /** Projects where the student is the submitter or a team member (the submitter is always a member). */
    @Query("select distinct p from Project p join p.members m where m.id = :userId order by p.submittedAt desc")
    List<Project> findAllByMemberId(@Param("userId") Long userId);

    List<Project> findByFacultyAndStatusInOrderBySubmittedAtDesc(User faculty, Collection<SubmissionStatus> statuses);

    List<Project> findByStatusOrderBySubmittedAtDesc(SubmissionStatus status);

    boolean existsByCategoryId(Long categoryId);
    boolean existsByAcademicYearId(Long academicYearId);
    long countByStatus(SubmissionStatus status);
}
