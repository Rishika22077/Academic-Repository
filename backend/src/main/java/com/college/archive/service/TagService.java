package com.college.archive.service;

import com.college.archive.entity.Tag;
import com.college.archive.entity.TagType;
import com.college.archive.exception.BadRequestException;
import com.college.archive.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;

/** Turns the keyword / technology strings typed by the user into shared Tag rows. */
@Service
@RequiredArgsConstructor
public class TagService {

    private static final int MAX_TAGS = 15;
    private static final int MAX_LENGTH = 100;

    private final TagRepository tagRepository;

    @Transactional
    public Set<Tag> resolve(Collection<String> names, TagType type) {
        Set<Tag> result = new LinkedHashSet<>();
        if (names == null) return result;

        Set<String> seen = new HashSet<>();
        for (String raw : names) {
            if (raw == null) continue;
            String name = raw.trim().replaceAll("\\s+", " ");
            if (name.isEmpty()) continue;
            if (name.length() > MAX_LENGTH) {
                throw new BadRequestException("A keyword/technology is too long (maximum " + MAX_LENGTH + " characters)");
            }
            if (!seen.add(name.toLowerCase())) continue;          // ignore duplicates such as "AI" and "ai"
            if (seen.size() > MAX_TAGS) {
                throw new BadRequestException("At most " + MAX_TAGS + " entries are allowed per list");
            }
            Tag tag = tagRepository.findByNameIgnoreCaseAndType(name, type)
                    .orElseGet(() -> tagRepository.save(new Tag(name, type)));
            result.add(tag);
        }
        return result;
    }
}
