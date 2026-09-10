package com.smartfarm.features.knowledge.service;

import org.springframework.stereotype.Component;

/**
 * Text normalizer for agricultural knowledge source text.
 *
 * <p>Performs clean, non-destructive string normalization prior to chunking:
 * <ul>
 *   <li>Standardizes line endings (\r\n -> \n)
 *   <li>Trims trailing whitespace per line
 *   <li>Collapses multiple consecutive blank lines into double newlines (\n\n) to preserve paragraph boundaries
 *   <li>Trims leading and trailing text whitespace
 * </ul>
 *
 * <p>Does NOT rewrite, translate, or alter agricultural terminology or numerical data.
 */
@Component
public class TextNormalizer {

    public String normalize(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }

        // Standardize line breaks
        String text = input.replace("\r\n", "\n").replace("\r", "\n");

        // Trim whitespace per line
        String[] lines = text.split("\n", -1);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < lines.length; i++) {
            sb.append(lines[i].stripTrailing());
            if (i < lines.length - 1) {
                sb.append("\n");
            }
        }
        text = sb.toString();

        // Collapse 3 or more consecutive newlines down to 2 (\n\n for paragraph breaks)
        text = text.replaceAll("\n{3,}", "\n\n");

        return text.trim();
    }
}
