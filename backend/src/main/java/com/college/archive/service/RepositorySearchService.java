package com.college.archive.service;

import com.college.archive.dto.ItemSummary;
import com.college.archive.dto.PageResponse;
import com.college.archive.exception.BadRequestException;
import com.college.archive.search.PageUtils;
import com.college.archive.search.SearchCriteria;
import com.college.archive.search.SearchType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/** Backs the unified "Search in: All / Projects / Research Papers" page. */
@Service
@RequiredArgsConstructor
public class RepositorySearchService {

    private static final int MAX_WINDOW = 500;   // (page + 1) * size limit for the merged "All" view

    private final ProjectService projectService;
    private final ResearchPaperService paperService;

    public PageResponse<ItemSummary> search(SearchType type, SearchCriteria criteria, int page, int size) {
        switch (type) {
            case PROJECTS:
                return PageResponse.from(projectService.search(criteria, PageUtils.of(page, size)));
            case PAPERS:
                return PageResponse.from(paperService.search(criteria, PageUtils.of(page, size)));
            default:
                return searchAll(criteria, page, size);
        }
    }

    /**
     * For ALL we take the newest (page+1)*size items from each table, merge them by approval date,
     * and cut out the requested page. Totals are the sum of both tables.
     */
    private PageResponse<ItemSummary> searchAll(SearchCriteria criteria, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);
        int window = (safePage + 1) * safeSize;
        if (window > MAX_WINDOW) {
            throw new BadRequestException("Please narrow your search instead of paging this deep");
        }
        PageRequest firstN = PageRequest.of(0, window, Sort.by(Sort.Direction.DESC, "approvedAt"));

        Page<ItemSummary> projects = projectService.search(criteria, firstN);
        Page<ItemSummary> papers = paperService.search(criteria, firstN);

        List<ItemSummary> merged = new ArrayList<>(projects.getContent());
        merged.addAll(papers.getContent());
        merged.sort(Comparator.comparing(ItemSummary::approvedAt, Comparator.nullsLast(Comparator.<LocalDateTime>reverseOrder())));

        int from = Math.min(safePage * safeSize, merged.size());
        int to = Math.min(from + safeSize, merged.size());
        long total = projects.getTotalElements() + papers.getTotalElements();
        int totalPages = (int) Math.ceil(total / (double) safeSize);
        return new PageResponse<>(merged.subList(from, to), safePage, safeSize, total, totalPages);
    }
}
