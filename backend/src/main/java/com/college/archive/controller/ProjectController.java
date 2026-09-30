package com.college.archive.controller;

import com.college.archive.dto.*;
import com.college.archive.entity.SubmissionStatus;
import com.college.archive.entity.User;
import com.college.archive.search.PageUtils;
import com.college.archive.search.SearchCriteria;
import com.college.archive.service.CurrentUserService;
import com.college.archive.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Multipart requests carry two parts:
 *   data   - JSON (Content-Type: application/json) matching ProjectRequest
 *   report - the PDF file
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final CurrentUserService currentUser;

    // ---- student ----

    @PostMapping(value = "/projects", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ProjectDetailResponse> create(@Valid @RequestPart("data") ProjectRequest data,
                                                        @RequestPart("report") MultipartFile report,
                                                        Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.create(data, report, currentUser.get(auth)));
    }

    /** Edit a rejected project and resubmit it. The "report" part is optional (keeps the old PDF if absent). */
    @PutMapping(value = "/projects/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    public ProjectDetailResponse resubmit(@PathVariable Long id,
                                          @Valid @RequestPart("data") ProjectRequest data,
                                          @RequestPart(value = "report", required = false) MultipartFile report,
                                          Authentication auth) {
        return projectService.resubmit(id, data, report, currentUser.get(auth));
    }

    @DeleteMapping("/projects/{id}")
    @PreAuthorize("hasAnyRole('STUDENT','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        projectService.delete(id, currentUser.get(auth));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/student/projects")
    public List<ItemSummary> myProjects(Authentication auth) {
        return projectService.listForStudent(currentUser.get(auth));
    }

    // ---- faculty ----

    @PutMapping("/projects/{id}/approve")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ProjectDetailResponse approve(@PathVariable Long id, Authentication auth) {
        return projectService.approve(id, currentUser.get(auth));
    }

    @PutMapping("/projects/{id}/reject")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ProjectDetailResponse reject(@PathVariable Long id,
                                        @Valid @RequestBody RejectRequest body,
                                        Authentication auth) {
        return projectService.reject(id, body.reason(), currentUser.get(auth));
    }

    /** Submissions assigned to the logged-in faculty. Default: PENDING + RESUBMITTED. Example: ?status=APPROVED,REJECTED */
    @GetMapping("/faculty/projects")
    public List<ItemSummary> facultyQueue(@RequestParam(required = false) List<SubmissionStatus> status,
                                          Authentication auth) {
        return projectService.listForFaculty(currentUser.get(auth), status);
    }

    // ---- admin ----

    @GetMapping("/admin/projects")
    public List<ItemSummary> adminList(@RequestParam(required = false) SubmissionStatus status) {
        return projectService.listForAdmin(status);
    }

    // ---- any logged-in user ----

    @GetMapping("/projects/search")
    public PageResponse<ItemSummary> search(@RequestParam(required = false) String q,
                                            @RequestParam(required = false) Long categoryId,
                                            @RequestParam(required = false) Long academicYearId,
                                            @RequestParam(required = false) String technology,
                                            @RequestParam(required = false) Long facultyId,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "10") int size) {
        SearchCriteria criteria = new SearchCriteria(q, categoryId, academicYearId, technology, facultyId, null, null);
        return PageResponse.from(projectService.search(criteria, PageUtils.of(page, size)));
    }

    /** Approved projects for everyone; other statuses only for the people involved and admins. */
    @GetMapping("/projects/{id}")
    public ProjectDetailResponse get(@PathVariable Long id, Authentication auth) {
        return projectService.get(id, currentUser.get(auth));
    }

    @GetMapping("/projects/{id}/report")
    public ResponseEntity<Resource> report(@PathVariable Long id,
                                           @RequestParam(defaultValue = "false") boolean download,
                                           Authentication auth) {
        User viewer = currentUser.get(auth);
        return ReportResponses.pdf(projectService.getReport(id, viewer), download);
    }
}
