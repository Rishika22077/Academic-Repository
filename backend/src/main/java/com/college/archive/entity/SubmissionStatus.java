package com.college.archive.entity;

/** Shared by projects and research papers. */
public enum SubmissionStatus {
    PENDING,      // waiting for the faculty guide
    APPROVED,     // visible in the repository
    REJECTED,     // rejection reason is set; student may edit
    RESUBMITTED   // student edited a rejected item; faculty reviews again
}
