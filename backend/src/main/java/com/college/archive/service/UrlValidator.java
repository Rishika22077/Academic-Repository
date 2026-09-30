package com.college.archive.service;

import com.college.archive.exception.BadRequestException;

import java.net.URI;
import java.net.URISyntaxException;

public final class UrlValidator {

    private UrlValidator() {}

    /**
     * Returns null for empty input (the URL is optional); otherwise returns the trimmed URL
     * if it is a well-formed http/https link. Rejecting other schemes (javascript:, data:, file:)
     * matters because the frontend renders this value as a clickable link.
     */
    public static String normalizeOptional(String raw, String fieldLabel) {
        if (raw == null || raw.isBlank()) return null;
        String value = raw.trim();
        if (value.length() > 500) {
            throw new BadRequestException(fieldLabel + " is too long (maximum 500 characters)");
        }
        try {
            URI uri = new URI(value);
            String scheme = uri.getScheme();
            boolean httpScheme = scheme != null
                    && (scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"));
            if (!httpScheme || uri.getHost() == null || uri.getHost().isBlank()) {
                throw new BadRequestException(fieldLabel + " must be a valid http(s) link, e.g. https://github.com/user/project");
            }
            return value;
        } catch (URISyntaxException e) {
            throw new BadRequestException(fieldLabel + " must be a valid http(s) link, e.g. https://github.com/user/project");
        }
    }
}
