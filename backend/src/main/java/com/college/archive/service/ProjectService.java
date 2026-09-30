package com.college.archive.service;

import com.college.archive.dto.*;
import com.college.archive.entity.*;
import com.college.archive.exception.BadRequestException;
import com.college.archive.exception.ResourceNotFoundException;
import com.college.archive.repository.AcademicYearRepository;
import com.college.archive.repository.CategoryRepository;
import com.college.archive.repository.ProjectRepository;
import com.college.archive.repository.UserRepository;
import com.college.archive.search.ProjectSpecs;
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

/**
 * Business rules for capstone projects:
 * PENDING -> APPROVED | REJECTED;  REJECTED -> (student edits) -> RESUBMITTED -> APPROVED | REJECTED.
 */
@Service
@RequiredArgsConstructor
public class ProjectService {

    private static final String FOLDER = "projects";
    private static final Set<SubmissionStatus> REVIEWABLE = EnumSet.of(SubmissionStatus.PENDING, SubmissionStatus.RESUBMITTED);

    private final ProjectRepository projectRepository;
    private final CategoryRepository categoryRepository;
    private final AcademicYearRepository academicYearRepository;
    private final UserRepository userRepository;
    private final TagService tagService;
    private final FileStorageService fileStorage;

    // ---------------------------------------------------------------- student actions

    @Transactional
    public ProjectDetailResponse create(ProjectRequest req, MultipartFile report, User student) {
        if (report == null || report.isEmpty()) {
            throw new BadRequestException("A PDF report is required");
        }
        Project project = new Project();
        project.setSubmittedBy(student);
        applyRequest(project, req, student);          // validates everything before we touch the disk

        String storedPath = fileStorage.store(report, FOLDER);
        project.setReportPath(storedPath);
        project.setOriginalReportName(fileStorage.displayName(report));
        project.setStatus(SubmissionStatus.PENDING);

        try {
            projectRepository.saveAndFlush(project);
        } catch (RuntimeException e) {
            fileStorage.delete(storedPath);           // do not leave an orphan PDF behind
            throw e;
        }
        return toDetail(project);
    }

    /** Student edits a REJECTED project and sends it back for review. */
    @Transactional
    public ProjectDetailResponse resubmit(Long id, ProjectRequest req, MultipartFile newReport, User student) {
        Project project = find(id);
        if (!project.getSubmittedBy().getId().equals(student.getId())) {
            throw new AccessDeniedException("Only the student who submitted this project can edit it");
        }
        if (project.getStatus() != SubmissionStatus.REJECTED) {
            throw new BadRequestException("Only rejected projects can be edited and resubmitted");
        }
        applyRequest(project, req, student);

        String oldPath = null;
        if (newReport != null && !newReport.isEmpty()) {
            oldPath = project.getReportPath();
            project.setReportPath(fileStorage.store(newReport, FOLDER));
            project.setOriginalReportName(fileStorage.displayName(newReport));
        }
        project.setStatus(SubmissionStatus.RESUBMITTED);
        project.setRejectionReason(null);
        project.setApprovedAt(null);
        projectRepository.saveAndFlush(project);

        if (oldPath != null) fileStorage.delete(oldPath);
        return toDetail(project);
    }

    @Transactional
    public void delete(Long id, User user) {
        Project project = find(id);
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean isOwner = project.getSubmittedBy().getId().equals(user.getId());
        if (!isAdmin && !isOwner) {
            throw new AccessDeniedException("You cannot delete this project");
        }
        if (!isAdmin && project.getStatus() == SubmissionStatus.APPROVED) {
            throw new BadRequestException("Approved projects can only be removed by an administrator");
        }
        String path = project.getReportPath();
        projectRepository.delete(project);
        projectRepository.flush();
        fileStorage.delete(path);
    }

    // ---------------------------------------------------------------- faculty / admin review

    @Transactional
    public ProjectDetailResponse approve(Long id, User reviewer) {
        Project project = find(id);
        assertCanReview(project, reviewer);
        project.setStatus(SubmissionStatus.APPROVED);
        project.setApprovedAt(LocalDateTime.now());
        project.setRejectionReason(null);
        return toDetail(project);
    }

    @Transactional
    public ProjectDetailResponse reject(Long id, String reason, User reviewer) {
        if (reason == null || reason.isBlank()) {
            throw new BadRequestException("A rejection reason is required");
        }
        Project project = find(id);
        assertCanReview(project, reviewer);
        project.setStatus(SubmissionStatus.REJECTED);
        project.setRejectionReason(reason.trim());
        project.setApprovedAt(null);
        return toDetail(project);
    }

    // ---------------------------------------------------------------- reads

    @Transactional(readOnly = true)
    public ProjectDetailResponse get(Long id, User viewer) {
        Project project = find(id);
        assertCanView(project, viewer);
        return toDetail(project);
    }

    @Transactional(readOnly = true)
    public ReportFile getReport(Long id, User viewer) {
        Project project = find(id);
        assertCanView(project, viewer);
        return new ReportFile(fileStorage.load(project.getReportPath()), project.getOriginalReportName());
    }

    @Transactional(readOnly = true)
    public List<ItemSummary> listForStudent(User student) {
        return projectRepository.findAllByMemberId(student.getId()).stream().map(this::toSummary).toList();
    }

    /** Faculty queue. With no statuses given: what still needs a decision. */
    @Transactional(readOnly = true)
    public List<ItemSummary> listForFaculty(User faculty, Collection<SubmissionStatus> statuses) {
        Collection<SubmissionStatus> wanted = (statuses == null || statuses.isEmpty()) ? REVIEWABLE : statuses;
        return projectRepository.findByFacultyAndStatusInOrderBySubmittedAtDesc(faculty, wanted)
                .stream().map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public List<ItemSummary> listForAdmin(SubmissionStatus status) {
        List<Project> projects = (status == null)
                ? projectRepository.findAll(Sort.by(Sort.Direction.DESC, "submittedAt"))
                : projectRepository.findByStatusOrderBySubmittedAtDesc(status);
        return projects.stream().map(this::toSummary).toList();
    }

    /** Public repository search - approved projects only. */
    @Transactional(readOnly = true)
    public Page<ItemSummary> search(SearchCriteria criteria, Pageable pageable) {
        return projectRepository.findAll(ProjectSpecs.approvedMatching(criteria), pageable).map(this::toSummary);
    }

    // ---------------------------------------------------------------- helpers

    private Project find(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

    private void assertCanReview(Project p, User reviewer) {
        boolean assignedFaculty = reviewer.getRole() == Role.FACULTY && p.getFaculty().getId().equals(reviewer.getId());
        if (reviewer.getRole() != Role.ADMIN && !assignedFaculty) {
            throw new AccessDeniedException("This project is assigned to a different faculty guide");
        }
        if (!REVIEWABLE.contains(p.getStatus())) {
            throw new BadRequestException("Only pending or resubmitted projects can be reviewed (current status: " + p.getStatus() + ")");
        }
    }

    /** Approved = visible to any logged-in user. Everything else only to people involved. 404 hides existence. */
    private void assertCanView(Project p, User viewer) {
        if (p.getStatus() == SubmissionStatus.APPROVED || viewer.getRole() == Role.ADMIN) return;
        boolean involved = p.getFaculty().getId().equals(viewer.getId())
                || p.getSubmittedBy().getId().equals(viewer.getId())
                || p.getMembers().stream().anyMatch(m -> m.getId().equals(viewer.getId()));
        if (!involved) throw new ResourceNotFoundException("Project not found");
    }

    /** Copies and validates request fields onto the entity (used for both create and resubmit). */
    private void applyRequest(Project p, ProjectRequest req, User student) {
        p.setTitle(req.title().trim());
        p.setAbstractText(req.abstractText().trim());
        p.setDepartment(req.department().trim());
        p.setGithubUrl(UrlValidator.normalizeOptional(req.githubUrl(), "GitHub/project URL"));

        p.setCategory(categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new BadRequestException("Selected category does not exist")));
        p.setAcademicYear(academicYearRepository.findById(req.academicYearId())
                .orElseThrow(() -> new BadRequestException("Selected academic year does not exist")));
        p.setFaculty(userRepository.findById(req.facultyId())
                .filter(u -> u.getRole() == Role.FACULTY && u.isActive())
                .orElseThrow(() -> new BadRequestException("Selected faculty guide is not available")));

        Set<User> members = new LinkedHashSet<>();
        members.add(student);
        if (req.memberIds() != null) {
            for (Long memberId : req.memberIds()) {
                if (memberId.equals(student.getId())) continue;   // the submitter is already a member
                User m = userRepository.findById(memberId)
                        .filter(u -> u.getRole() == Role.STUDENT && u.isActive())
                        .orElseThrow(() -> new BadRequestException("Team member with id " + memberId + " is not an active student"));
                members.add(m);
            }
        }
        p.getMembers().clear();
        p.getMembers().addAll(members);

        Set<Tag> tags = new LinkedHashSet<>(tagService.resolve(req.keywords(), TagType.KEYWORD));
        tags.addAll(tagService.resolve(req.technologies(), TagType.TECHNOLOGY));
        if (tags.stream().noneMatch(t -> t.getType() == TagType.KEYWORD)) {
            throw new BadRequestException("Add at least one keyword");
        }
        p.getTags().clear();
        p.getTags().addAll(tags);
    }

    private ItemSummary toSummary(Project p) {
        return new ItemSummary("PROJECT", p.getId(), p.getTitle(),
                p.getCategory().getName(), p.getAcademicYear().getLabel(),
                DtoUtils.preview(p.getAbstractText()),
                p.getMembers().stream().map(User::getName).sorted().toList(),
                DtoUtils.tagNames(p.getTags(), TagType.KEYWORD),
                DtoUtils.tagNames(p.getTags(), TagType.TECHNOLOGY),
                p.getFaculty().getName(), null,
                p.getStatus().name(), p.getRejectionReason(),
                p.getSubmittedAt(), p.getApprovedAt());
    }

    private ProjectDetailResponse toDetail(Project p) {
        return new ProjectDetailResponse(p.getId(), p.getTitle(), p.getAbstractText(), p.getDepartment(),
                p.getCategory().getName(), p.getAcademicYear().getLabel(),
                DtoUtils.person(p.getFaculty()), DtoUtils.person(p.getSubmittedBy()),
                p.getMembers().stream().map(DtoUtils::person).sorted(Comparator.comparing(PersonDto::name)).toList(),
                DtoUtils.tagNames(p.getTags(), TagType.KEYWORD),
                DtoUtils.tagNames(p.getTags(), TagType.TECHNOLOGY),
                p.getGithubUrl(), "/api/projects/" + p.getId() + "/report", p.getOriginalReportName(),
                p.getStatus().name(), p.getRejectionReason(), p.getSubmittedAt(), p.getApprovedAt());
    }
}
