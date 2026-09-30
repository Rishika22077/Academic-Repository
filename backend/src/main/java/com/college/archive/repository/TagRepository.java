package com.college.archive.repository;

import com.college.archive.entity.Tag;
import com.college.archive.entity.TagType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {

    Optional<Tag> findByNameIgnoreCaseAndType(String name, TagType type);

    /** Tag names used by at least one APPROVED project or paper - feeds the search filter dropdowns. */
    @Query("""
            select distinct t.name from Tag t
            where t.type = :type and (
                exists (select p.id from Project p join p.tags pt
                        where pt = t and p.status = com.college.archive.entity.SubmissionStatus.APPROVED)
                or exists (select r.id from ResearchPaper r join r.tags rt
                        where rt = t and r.status = com.college.archive.entity.SubmissionStatus.APPROVED))
            order by t.name
            """)
    List<String> findApprovedTagNames(@Param("type") TagType type);
}
