package com.college.archive.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "academic_years")
@Getter @Setter @NoArgsConstructor
public class AcademicYear {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** e.g. "2025-26" */
    @Column(nullable = false, unique = true, length = 20)
    private String label;

    public AcademicYear(String label) {
        this.label = label;
    }
}
