package com.college.archive.controller;

import com.college.archive.dto.ItemSummary;
import com.college.archive.dto.PageResponse;
import com.college.archive.search.SearchCriteria;
import com.college.archive.search.SearchType;
import com.college.archive.service.RepositorySearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/repository")
@RequiredArgsConstructor
public class RepositorySearchController {

    private final RepositorySearchService searchService;

    /**
     * The unified search page: type = ALL | PROJECTS | PAPERS.
     * Example: GET /api/repository/search?type=ALL&q=phishing&categoryId=1
     */
    @GetMapping("/search")
    public PageResponse<ItemSummary> search(@RequestParam(defaultValue = "ALL") String type,
                                            @RequestParam(required = false) String q,
                                            @RequestParam(required = false) Long categoryId,
                                            @RequestParam(required = false) Long academicYearId,
                                            @RequestParam(required = false) String technology,
                                            @RequestParam(required = false) Long facultyId,
                                            @RequestParam(required = false) Integer publicationYear,
                                            @RequestParam(required = false) String author,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "10") int size) {
        SearchCriteria criteria = new SearchCriteria(q, categoryId, academicYearId, technology, facultyId, publicationYear, author);
        return searchService.search(SearchType.parse(type), criteria, page, size);
    }
}
