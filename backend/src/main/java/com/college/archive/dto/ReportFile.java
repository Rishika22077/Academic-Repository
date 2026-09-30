package com.college.archive.dto;

import org.springframework.core.io.Resource;

public record ReportFile(Resource resource, String filename) {}
