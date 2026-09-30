package com.college.archive.service;

import com.college.archive.dto.*;
import com.college.archive.entity.*;
import com.college.archive.exception.BadRequestException;
import com.college.archive.exception.ResourceNotFoundException;
import com.college.archive.repository.AcademicYearRepository;
import com.college.archive.repository.CategoryRepository;
import com.college.archive.repository.ResearchPaperRepository;
import com.college.archive.repository.UserRepository;
import com.college.archive.search.PaperSpecs;
import com.college.archive.search.SearchCriteria;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;

/** Same review workflow as projects, for departmental research papers. */
@Service
@RequiredArgsConstructor
public class ResearchPaperService {

    private static final String FOLDER = "papers";
    private static final Set<SubmissionStatus> REVIEWABLE = EnumSet.of(SubmissionStatus.PENDING, SubmissionStatus.RESUBMITTED);

    private final ResearchPaperRepository paperRepository;
    private final CategoryRepository categoryRepository;
    private final AcademicYearRepository academicYearRepository;
    private final UserRepository userRepository;
    private final TagService tagService;
    private final FileStorageService fileStorage;

    // ---------------------------------------------------------------- student actions

    @Transactional
    public ResearchPaperDetailResponse create(ResearchPaperRequest req, MultipartFile pdf, User student) {
        if (pdf == null || pdf.isEmpty()) {
            throw new BadRequestException("A PDF of the paper is required");
        }
        ResearchPaper paper = new ResearchPaper();
        paper.setSubmittedBy(student);
        applyRequest(paper, req);

        String storedPath = fileStorage.store(pdf, FOLDER);
        paper.setReportPath(storedPath);
        paper.setOriginalReportName(fileStorage.displayName(pdf));
        paper.setStatus(SubmissionStatus.PENDING);

        try {
            paperRepository.saveAndFlush(paper);
        } catch (RuntimeException e) {
            fileStorage.delete(storedPath);
            throw e;
        }
        return toDetail(paper);
    }

    @Transactional
    public ResearchPaperDetailResponse resubmit(Long id, ResearchPaperRequest req, MultipartFile newPdf, User student) {
        ResearchPaper paper = find(id);
        if (!paper.getSubmittedBy().getId().equals(student.getId())) {
            throw new AccessDeniedException("Only the student who submitted this paper can edit it");
        }
        if (paper.getStatus() != SubmissionStatus.REJECTED) {
            throw new BadRequestException("Only rejected papers can be edited and resubmitted");
        }
        applyRequest(paper, req);

        String oldPath = null;
        if (newPdf != null && !newPdf.isEmpty()) {
            oldPath = paper.getReportPath();
            paper.setReportPath(fileStorage.store(newPdf, FOLDER));
            paper.setOriginalReportName(fileStorage.displayName(newPdf));
        }
        paper.setStatus(SubmissionStatus.RESUBMITTED);
        paper.setRejectionReason(null);
        paper.setApprovedAt(null);
        paperRepository.saveAndFlush(paper);

        if (oldPath != null) fileStorage.delete(oldPath);
        return toDetail(paper);
    }

    @Transactional
    public void delete(Long id, User user) {
        ResearchPaper paper = find(id);
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean isOwner = paper.getSubmittedBy().getId().equals(user.getId());
        if (!isAdmin && !isOwner) {
            throw new AccessDeniedException("You cannot delete this paper");
        }
        if (!isAdmin && paper.getStatus() == SubmissionStatus.APPROVED) {
            throw new BadRequestException("Approved papers can only be removed by an administrator");
        }
        String path = paper.getReportPath();
        paperRepository.delete(paper);
        paperRepository.flush();
        fileStorage.delete(path);
    }

    // ---------------------------------------------------------------- faculty / admin review

    @Transactional
    public ResearchPaperDetailResponse approve(Long id, User reviewer) {
        ResearchPaper paper = find(id);
        assertCanReview(paper, reviewer);
        paper.setStatus(SubmissionStatus.APPROVED);
        paper.setApprovedAt(LocalDateTime.now());
        paper.setRejectionReason(null);
        return toDetail(paper);
    }

    @Transactional
    public ResearchPaperDetailResponse reject(Long id, String reason, User reviewer) {
        if (reason == null || reason.isBlank()) {
            throw new BadRequestException("A rejection reason is required");
        }
        ResearchPaper paper = find(id);
        assertCanReview(paper, reviewer);
        paper.setStatus(SubmissionStatus.REJECTED);
        paper.setRejectionReason(reason.trim());
        paper.setApprovedAt(null);
        return toDetail(paper);
    }

    // ---------------------------------------------------------------- reads

    @Transactional(readOnly = true)
    public ResearchPaperDetailResponse get(Long id, User viewer) {
        ResearchPaper paper = find(id);
        assertCanView(paper, viewer);
        return toDetail(paper);
    }

    @Transactional(readOnly = true)
    public ReportFile getReport(Long id, User viewer) {
        ResearchPaper paper = find(id);
        assertCanView(paper, viewer);
        return new ReportFile(fileStorage.load(paper.getReportPath()), paper.getOriginalReportName());
    }

    @Transactional(readOnly = true)
    public List<ItemSummary> listForStudent(User student) {
        return paperRepository.findBySubmittedByOrderBySubmittedAtDesc(student).stream().map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public List<ItemSummary> listForFaculty(User faculty, Collection<SubmissionStatus> statuses) {
        Collection<SubmissionStatus> wanted = (statuses == null || statuses.isEmpty()) ? REVIEWABLE : statuses;
        return paperRepository.findByFacultyAndStatusInOrderBySubmittedAtDesc(faculty, wanted)
                .stream().map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public List<ItemSummary> listForAdmin(SubmissionStatus status) {
        List<ResearchPaper> papers = (status == null)
                ? paperRepository.findAll(Sort.by(Sort.Direction.DESC, "submittedAt"))
                : paperRepository.findByStatusOrderBySubmittedAtDesc(status);
        return papers.stream().map(this::toSummary).toList();
    }

    /** Keyword search - PostgreSQL query, approved papers only. */
    @Transactional(readOnly = true)
    public Page<ItemSummary> search(SearchCriteria criteria, Pageable pageable) {
        return paperRepository.findAll(PaperSpecs.approvedMatching(criteria), pageable).map(this::toSummary);
    }

    // ---------------------------------------------------------------- helpers

    private ResearchPaper find(Long id) {
        return paperRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Research paper not found"));
    }

    private void assertCanReview(ResearchPaper p, User reviewer) {
        boolean assignedFaculty = reviewer.getRole() == Role.FACULTY && p.getFaculty().getId().equals(reviewer.getId());
        if (reviewer.getRole() != Role.ADMIN && !assignedFaculty) {
            throw new AccessDeniedException("This paper is assigned to a different faculty reviewer");
        }
        if (!REVIEWABLE.contains(p.getStatus())) {
            throw new BadRequestException("Only pending or resubmitted papers can be reviewed (current status: " + p.getStatus() + ")");
        }
    }

    private void assertCanView(ResearchPaper p, User viewer) {
        if (p.getStatus() == SubmissionStatus.APPROVED || viewer.getRole() == Role.ADMIN) return;
        boolean involved = p.getFaculty().getId().equals(viewer.getId())
                || p.getSubmittedBy().getId().equals(viewer.getId());
        if (!involved) throw new ResourceNotFoundException("Research paper not found");
    }

    private void applyRequest(ResearchPaper p, ResearchPaperRequest req) {
        p.setTitle(req.title().trim());
        p.setAuthors(req.authors().trim());
        p.setAbstractText(req.abstractText().trim());
        p.setDepartment(req.department().trim());
        p.setAffiliation(blankToNull(req.affiliation()));
        p.setVenue(blankToNull(req.venue()));
        p.setPublicationYear(req.publicationYear());
        p.setDoi(normalizeDoi(req.doi()));
        p.setExternalUrl(UrlValidator.normalizeOptional(req.externalUrl(), "Paper URL"));

        p.setCategory(categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new BadRequestException("Selected research category does not exist")));
        p.setAcademicYear(academicYearRepository.findById(req.academicYearId())
                .orElseThrow(() -> new BadRequestException("Selected academic year does not exist")));
        p.setFaculty(userRepository.findById(req.facultyId())
                .filter(u -> u.getRole() == Role.FACULTY && u.isActive())
                .orElseThrow(() -> new BadRequestException("Selected faculty reviewer is not available")));

        Set<Tag> keywords = tagService.resolve(req.keywords(), TagType.KEYWORD);
        if (keywords.isEmpty()) {
            throw new BadRequestException("Add at least one keyword");
        }
        Set<Tag> tags = new LinkedHashSet<>(keywords);
        tags.addAll(tagService.resolve(req.researchAreas(), TagType.TECHNOLOGY));
        p.getTags().clear();
        p.getTags().addAll(tags);
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    /** Accepts "10.1000/xyz" or "https://doi.org/10.1000/xyz"; stores the bare DOI. */
    private String normalizeDoi(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String doi = raw.trim().replaceFirst("(?i)^https?://(dx\\.)?doi\\.org/", "");
        if (!doi.matches("10\\.\\d{4,9}/\\S+")) {
            throw new BadRequestException("DOI must look like 10.1000/example");
        }
        return doi;
    }

    private ItemSummary toSummary(ResearchPaper p) {
        List<String> authors = Arrays.stream(p.getAuthors().split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).toList();
        return new ItemSummary("RESEARCH_PAPER", p.getId(), p.getTitle(),
                p.getCategory().getName(), p.getAcademicYear().getLabel(),
                DtoUtils.preview(p.getAbstractText()), authors,
                DtoUtils.tagNames(p.getTags(), TagType.KEYWORD),
                DtoUtils.tagNames(p.getTags(), TagType.TECHNOLOGY),
                p.getFaculty().getName(), p.getPublicationYear(),
                p.getStatus().name(), p.getRejectionReason(),
                p.getSubmittedAt(), p.getApprovedAt());
    }

    private ResearchPaperDetailResponse toDetail(ResearchPaper p) {
        return new ResearchPaperDetailResponse(p.getId(), p.getTitle(), p.getAuthors(), p.getAbstractText(),
                p.getDepartment(), p.getCategory().getName(), p.getAcademicYear().getLabel(),
                DtoUtils.person(p.getFaculty()), DtoUtils.person(p.getSubmittedBy()),
                p.getAffiliation(), p.getVenue(), p.getPublicationYear(),
                p.getDoi(), p.getDoi() == null ? null : "https://doi.org/" + p.getDoi(), p.getExternalUrl(),
                DtoUtils.tagNames(p.getTags(), TagType.KEYWORD),
                DtoUtils.tagNames(p.getTags(), TagType.TECHNOLOGY),
                "/api/research-papers/" + p.getId() + "/report", p.getOriginalReportName(),
                p.getStatus().name(), p.getRejectionReason(), p.getSubmittedAt(), p.getApprovedAt());
    }
}
