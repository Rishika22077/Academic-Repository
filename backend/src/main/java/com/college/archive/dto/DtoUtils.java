package com.college.archive.dto;

import com.college.archive.entity.Tag;
import com.college.archive.entity.TagType;
import com.college.archive.entity.User;

import java.util.List;
import java.util.Set;

public final class DtoUtils {

    private DtoUtils() {}

    public static List<String> tagNames(Set<Tag> tags, TagType type) {
        return tags.stream()
                .filter(t -> t.getType() == type)
                .map(Tag::getName)
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();
    }

    public static PersonDto person(User u) {
        return new PersonDto(u.getId(), u.getName());
    }

    /** Short abstract preview for result lists (about 250 characters, cut at a word boundary). */
    public static String preview(String text) {
        if (text == null) return "";
        String t = text.strip().replaceAll("\\s+", " ");
        if (t.length() <= 250) return t;
        int cut = t.lastIndexOf(' ', 250);
        if (cut < 150) cut = 250;
        return t.substring(0, cut) + "…";
    }
}
