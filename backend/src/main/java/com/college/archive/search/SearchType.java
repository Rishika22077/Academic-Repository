package com.college.archive.search;

import com.college.archive.exception.BadRequestException;

public enum SearchType {
    ALL, PROJECTS, PAPERS;

    public static SearchType parse(String raw) {
        if (raw == null || raw.isBlank()) return ALL;
        try {
            return SearchType.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("type must be ALL, PROJECTS or PAPERS");
        }
    }
}
