package com.college.archive.controller;

import com.college.archive.dto.*;
import com.college.archive.entity.SubmissionStatus;
import com.college.archive.search.PageUtils;
import com.college.archive.search.SearchCriteria;
import com.college.archive.service.CurrentUserService;
import com.college.archive.service.ResearchPaperService;
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
 *   data   - JSON (Content-Type: application/json) matching ResearchPaperRequest
 *   report - the PDF file
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ResearchPaperController {

    private final ResearchPaperService paperService;
    private final CurrentUserService currentUser;

    // ---- student ----

    @PostMapping(value = "/research-papers", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ResearchPaperDetailResponse> create(@Valid @RequestPart("data") ResearchPaperRequest data,
                                                              @RequestPart("report") MultipartFile report,
                                                              Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paperService.create(data, report, currentUser.get(auth)));
    }

    @PutMapping(value = "/research-papers/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    public ResearchPaperDetailResponse resubmit(@PathVariable Long id,
                                                @Valid @RequestPart("data") ResearchPaperRequest data,
                                                @RequestPart(value = "report", required = false) MultipartFile report,
                                                Authentication auth) {
        return paperService.resubmit(id, data, report, currentUser.get(auth));
    }

    @DeleteMapping("/research-papers/{id}")
    @PreAuthorize("hasAnyRole('STUDENT','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        paperService.delete(id, currentUser.get(auth));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/student/research-papers")
    public List<ItemSummary> myPapers(Authentication auth) {
        return paperService.listForStudent(currentUser.get(auth));
    }

    // ---- faculty ----

    @PutMapping("/research-papers/{id}/approve")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResearchPaperDetailResponse approve(@PathVariable Long id, Authentication auth) {
        return paperService.approve(id, currentUser.get(auth));
    }

    @PutMapping("/research-papers/{id}/reject")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResearchPaperDetailResponse reject(@PathVariable Long id,
                                              @Valid @RequestBody RejectRequest body,
                                              Authentication auth) {
        return paperService.reject(id, body.reason(), currentUser.get(auth));
    }

    @GetMapping("/faculty/research-papers")
    public List<ItemSummary> facultyQueue(@RequestParam(required = false) List<SubmissionStatus> status,
                                          Authentication auth) {
        return paperService.listForFaculty(currentUser.get(auth), status);
    }

    // ---- admin ----

    @GetMapping("/admin/research-papers")
    public List<ItemSummary> adminList(@RequestParam(required = false) SubmissionStatus status) {
        return paperService.listForAdmin(status);
    }

    // ---- any logged-in user ----

    /** GET /api/research-papers/search?q=phishing  ->  PostgreSQL query, approved papers only. */
    @GetMapping("/research-papers/search")
    public PageResponse<ItemSummary> search(@RequestParam(required = false) String q,
                                            @RequestParam(required = false) Long categoryId,
                                            @RequestParam(required = false) Long academicYearId,
                                            @RequestParam(required = false) String technology,
                                            @RequestParam(required = false) Long facultyId,
                                            @RequestParam(required = false) Integer publicationYear,
                                            @RequestParam(required = false) String author,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "10") int size) {
        SearchCriteria criteria = new SearchCriteria(q, categoryId, academicYearId, technology, facultyId, publicationYear, author);
        return PageResponse.from(paperService.search(criteria, PageUtils.of(page, size)));
    }

    @GetMapping("/research-papers/{id}")
    public ResearchPaperDetailResponse get(@PathVariable Long id, Authentication auth) {
        return paperService.get(id, currentUser.get(auth));
    }

    @GetMapping("/research-papers/{id}/report")
    public ResponseEntity<Resource> report(@PathVariable Long id,
                                           @RequestParam(defaultValue = "false") boolean download,
                                           Authentication auth) {
        return ReportResponses.pdf(paperService.getReport(id, currentUser.get(auth)), download);
    }
}
