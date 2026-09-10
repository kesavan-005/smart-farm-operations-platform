package com.smartfarm.features.knowledge.service;

import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Deterministic character-based chunker with paragraph and sentence boundary awareness.
 *
 * <p>Given normalized text and (chunkSize, chunkOverlap) parameters, produces a deterministic
 * ordered list of text chunks.
 */
@Component
public class DeterministicChunker {

    /**
     * Chunks normalized text deterministically.
     *
     * @param text normalized non-blank source text
     * @param chunkSize target maximum character length per chunk (e.g., 1000)
     * @param chunkOverlap target overlap character length between adjacent chunks (e.g., 150)
     * @return non-empty ordered list of chunk strings
     */
    public List<String> chunk(String text, int chunkSize, int chunkOverlap) {
        if (text == null || text.isBlank()) {
            return List.of();
        }

        if (chunkSize <= 0) {
            chunkSize = 1000;
        }
        if (chunkOverlap < 0 || chunkOverlap >= chunkSize) {
            chunkOverlap = Math.min(150, chunkSize / 2);
        }

        String content = text.trim();
        List<String> chunks = new ArrayList<>();
        int length = content.length();

        if (length <= chunkSize) {
            chunks.add(content);
            return chunks;
        }

        int start = 0;
        while (start < length) {
            int end = Math.min(start + chunkSize, length);

            // If not at the end of text, attempt to find a clean natural boundary near target end
            if (end < length) {
                int boundary = findNaturalBoundary(content, start, end, chunkSize);
                if (boundary > start) {
                    end = boundary;
                }
            }

            String chunkText = content.substring(start, end).trim();
            if (!chunkText.isEmpty()) {
                chunks.add(chunkText);
            }

            if (end >= length) {
                break;
            }

            // Calculate next start index using overlap
            int nextStart = end - chunkOverlap;
            if (nextStart <= start) {
                nextStart = end;
            }

            start = nextStart;
        }

        return chunks;
    }

    /**
     * Searches backwards from 'end' within a search window to find paragraph or sentence breaks.
     */
    private int findNaturalBoundary(String text, int start, int end, int chunkSize) {
        int windowMin = Math.max(start + (chunkSize / 2), end - 200);

        // 1. Try paragraph break (\n\n)
        int paragraphBreak = text.lastIndexOf("\n\n", end);
        if (paragraphBreak >= windowMin) {
            return paragraphBreak + 2;
        }

        // 2. Try sentence breaks (. , ? , ! , Tamil full stop)
        for (int i = end - 1; i >= windowMin; i--) {
            char c = text.charAt(i);
            if ((c == '.' || c == '?' || c == '!' || c == '।') && i + 1 < text.length() && Character.isWhitespace(text.charAt(i + 1))) {
                return i + 1;
            }
        }

        // 3. Try line break (\n)
        int lineBreak = text.lastIndexOf("\n", end);
        if (lineBreak >= windowMin) {
            return lineBreak + 1;
        }

        // 4. Try word boundary (space)
        int spaceBreak = text.lastIndexOf(" ", end);
        if (spaceBreak >= windowMin) {
            return spaceBreak + 1;
        }

        return end;
    }
}
