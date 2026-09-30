package com.college.archive.search;

import com.college.archive.entity.*;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/** Builds the SQL WHERE clause for searching APPROVED projects. Runs in PostgreSQL via Hibernate. */
public final class ProjectSpecs {

    private ProjectSpecs() {}

    public static Specification<Project> approvedMatching(SearchCriteria c) {
        return (root, query, cb) -> {
            List<Predicate> all = new ArrayList<>();

            // Only approved projects are ever public.
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
            if (c.technology() != null && !c.technology().isBlank()) {
                Subquery<Long> sq = query.subquery(Long.class);
                Root<Project> p = sq.from(Project.class);
                Join<Project, Tag> t = p.join("tags");
                sq.select(p.<Long>get("id")).where(
                        cb.equal(p.get("id"), root.get("id")),
                        cb.equal(t.get("type"), TagType.TECHNOLOGY),
                        cb.equal(cb.lower(t.<String>get("name")), c.technology().trim().toLowerCase()));
                all.add(cb.exists(sq));
            }

            List<String> tokens = SpecUtils.tokens(c.q());
            if (!tokens.isEmpty()) {
                Join<Project, Category> category = root.join("category", JoinType.LEFT);
                Join<Project, User> faculty = root.join("faculty", JoinType.LEFT);
                Join<Project, AcademicYear> year = root.join("academicYear", JoinType.LEFT);

                for (String token : tokens) {
                    String pat = SpecUtils.pattern(token);

                    // student name: EXISTS (team member whose name matches)
                    Subquery<Long> members = query.subquery(Long.class);
                    Root<Project> mp = members.from(Project.class);
                    Join<Project, User> mu = mp.join("members");
                    members.select(mp.<Long>get("id")).where(
                            cb.equal(mp.get("id"), root.get("id")),
                            SpecUtils.like(cb, mu.<String>get("name"), pat));

                    // keyword / technology: EXISTS (tag whose name matches)
                    Subquery<Long> tags = query.subquery(Long.class);
                    Root<Project> tp = tags.from(Project.class);
                    Join<Project, Tag> tt = tp.join("tags");
                    tags.select(tp.<Long>get("id")).where(
                            cb.equal(tp.get("id"), root.get("id")),
                            SpecUtils.like(cb, tt.<String>get("name"), pat));

                    all.add(cb.or(
                            SpecUtils.like(cb, root.<String>get("title"), pat),
                            SpecUtils.like(cb, root.<String>get("abstractText"), pat),
                            SpecUtils.like(cb, category.<String>get("name"), pat),
                            SpecUtils.like(cb, faculty.<String>get("name"), pat),
                            SpecUtils.like(cb, year.<String>get("label"), pat),
                            cb.exists(members),
                            cb.exists(tags)));
                }
            }
            return cb.and(all.toArray(new Predicate[0]));
        };
    }
}
