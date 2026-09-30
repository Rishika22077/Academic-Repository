package com.college.archive.search;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;

import java.util.Arrays;
import java.util.List;

/** Shared helpers for the keyword search. */
public final class SpecUtils {

    private SpecUtils() {}

    /**
     * "machine learning" -> [machine, learning]; "phishing, email" -> [phishing, email].
     * Every word must match somewhere (AND), so more words = narrower results.
     */
    public static List<String> tokens(String q) {
        if (q == null || q.isBlank()) return List.of();
        return Arrays.stream(q.trim().toLowerCase().split("[\\s,]+"))
                .filter(s -> !s.isBlank())
                .distinct()
                .limit(8)
                .toList();
    }

    /** "%token%" with LIKE wildcards in the user's text escaped, so "50%" or "a_b" are matched literally. */
    public static String pattern(String token) {
        return "%" + token.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
    }

    public static Predicate like(CriteriaBuilder cb, Expression<String> field, String pattern) {
        return cb.like(cb.lower(field), pattern, '\\');
    }
}
