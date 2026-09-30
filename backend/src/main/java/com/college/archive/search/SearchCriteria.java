package com.college.archive.search;

/** All optional. {@code publicationYear} and {@code author} only apply to research papers. */
public record SearchCriteria(
        String q,
        Long categoryId,
        Long academicYearId,
        String technology,
        Long facultyId,
        Integer publicationYear,
        String author
) {}
