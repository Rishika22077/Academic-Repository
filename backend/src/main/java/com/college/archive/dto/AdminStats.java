package com.college.archive.dto;

import java.util.Map;

public record AdminStats(
        long students,
        long faculty,
        long admins,
        Map<String, Long> projectsByStatus,
        Map<String, Long> papersByStatus
) {}
