package com.college.archive.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "research_papers", indexes = {
        @Index(name = "idx_papers_status", columnList = "status"),
        @Index(name = "idx_papers_category", columnList = "category_id"),
        @Index(name = "idx_papers_year", columnList = "academic_year_id"),
        @Index(name = "idx_papers_pub_year", columnList = "publication_year"),
        @Index(name = "idx_papers_faculty", columnList = "faculty_id"),
        @Index(name = "idx_papers_submitted_by", columnList = "submitted_by")
})
@Getter @Setter @NoArgsConstructor
public class ResearchPaper {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    /** Comma-separated author names, e.g. "A. Student, B. Student". */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String authors;

    @Column(name = "abstract_text", nullable = false, columnDefinition = "TEXT")
    private String abstractText;

    @Column(nullable = false, length = 100)
    private String department;

    /** Research category (same categories table as projects). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "academic_year_id", nullable = false)
    private AcademicYear academicYear;

    /** Faculty who reviews the paper. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "faculty_id", nullable = false)
    private User faculty;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submitted_by", nullable = false)
    private User submittedBy;

    /** Author / faculty affiliation, where applicable. */
    @Column(length = 255)
    private String affiliation;

    /** Journal or conference name, if published. */
    @Column(length = 255)
    private String venue;

    @Column(name = "publication_year")
    private Integer publicationYear;

    @Column(length = 255)
    private String doi;

    @Column(name = "external_url", length = 500)
    private String externalUrl;

    @Column(name = "report_path", nullable = false, length = 500)
    private String reportPath;

    @Column(name = "original_report_name", length = 255)
    private String originalReportName;

    /** Keywords and research areas. */
    @ManyToMany
    @JoinTable(name = "paper_tags",
            joinColumns = @JoinColumn(name = "paper_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    private Set<Tag> tags = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubmissionStatus status = SubmissionStatus.PENDING;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime submittedAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @PrePersist
    void onCreate() {
        submittedAt = LocalDateTime.now();
    }
}
