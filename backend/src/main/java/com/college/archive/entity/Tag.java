package com.college.archive.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One row per distinct keyword / technology. Names are matched case-insensitively so that
 * "Phishing" and "phishing" are treated as the same tag (lookup ignores case),
 * while the first-entered spelling ("React", "AI") is kept for display.
 */
@Entity
@Table(name = "tags",
        uniqueConstraints = @UniqueConstraint(name = "uk_tags_name_type", columnNames = {"name", "type"}))
@Getter @Setter @NoArgsConstructor
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TagType type;

    public Tag(String name, TagType type) {
        this.name = name;
        this.type = type;
    }
}
