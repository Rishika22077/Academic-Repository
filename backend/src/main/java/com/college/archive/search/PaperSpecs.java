package com.college.archive.search;

import com.college.archive.entity.*;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/** Builds the SQL WHERE clause for searching APPROVED research papers. Runs in PostgreSQL via Hibernate. */
public final class PaperSpecs {

    private PaperSpecs() {}

    public static Specification<ResearchPaper> approvedMatching(SearchCriteria c) {
        return (root, query, cb) -> {
            List<Predicate> all = new ArrayList<>();

            // Pending / rejected papers never appear in search.
            all.add(cb.equal(root.get("status"), SubmissionStatus.APPROVED));

            if (c.categoryId() != null) {
                all.add(cb.equal(root.get("category").get("id"), c.categoryId()));
            }
            if (c.academicYearId() != null) {
                all.add(cb.equal(root.get("academicYear").get("id"), c.academicYearId()));
            }
            if (c.facultyId() != null) {
                all.add(cb.equal(root.get("faculty").get("id"), c.facultyId()));
            }
            if (c.publicationYear() != null) {
                all.add(cb.equal(root.get("publicationYear"), c.publicationYear()));
            }
            if (c.author() != null && !c.author().isBlank()) {
                all.add(SpecUtils.like(cb, root.<String>get("authors"), SpecUtils.pattern(c.author().trim().toLowerCase())));
            }
            if (c.technology() != null && !c.technology().isBlank()) {
                Subquery<Long> sq = query.subquery(Long.class);
                Root<ResearchPaper> p = sq.from(ResearchPaper.class);
                Join<ResearchPaper, Tag> t = p.join("tags");
                sq.select(p.<Long>get("id")).where(
                        cb.equal(p.get("id"), root.get("id")),
                        cb.equal(t.get("type"), TagType.TECHNOLOGY),
                        cb.equal(cb.lower(t.<String>get("name")), c.technology().trim().toLowerCase()));
                all.add(cb.exists(sq));
            }

            List<String> tokens = SpecUtils.tokens(c.q());
            if (!tokens.isEmpty()) {
                Join<ResearchPaper, Category> category = root.join("category", JoinType.LEFT);
                Join<ResearchPaper, AcademicYear> year = root.join("academicYear", JoinType.LEFT);

                for (String token : tokens) {
                    String pat = SpecUtils.pattern(token);

                    // keyword / research area: EXISTS (tag whose name matches)  ->  "phishing" finds the paper
                    Subquery<Long> tags = query.subquery(Long.class);
                    Root<ResearchPaper> tp = tags.from(ResearchPaper.class);
                    Join<ResearchPaper, Tag> tt = tp.join("tags");
                    tags.select(tp.<Long>get("id")).where(
                            cb.equal(tp.get("id"), root.get("id")),
                            SpecUtils.like(cb, tt.<String>get("name"), pat));

                    List<Predicate> anyField = new ArrayList<>(List.of(
                            SpecUtils.like(cb, root.<String>get("title"), pat),
                            SpecUtils.like(cb, root.<String>get("authors"), pat),
                            SpecUtils.like(cb, root.<String>get("abstractText"), pat),
                            SpecUtils.like(cb, root.<String>get("venue"), pat),
                            SpecUtils.like(cb, category.<String>get("name"), pat),
                            SpecUtils.like(cb, year.<String>get("label"), pat),
                            cb.exists(tags)));

                    // a number like "2026" may be a publication year
                    if (token.matches("\\d{4}")) {
                        anyField.add(cb.equal(root.get("publicationYear"), Integer.parseInt(token)));
                    }
                    all.add(cb.or(anyField.toArray(new Predicate[0])));
                }
            }
            return cb.and(all.toArray(new Predicate[0]));
        };
    }
}
