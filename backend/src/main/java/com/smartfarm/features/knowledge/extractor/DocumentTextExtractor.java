package com.smartfarm.features.knowledge.extractor;

import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.apache.tika.metadata.HttpHeaders;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.metadata.TikaCoreProperties;
import org.springframework.stereotype.Component;

/**
 * Service extracting raw textual content from supported binary and text document formats.
 *
 * <p>Supports:
 * <ul>
 *   <li>PDF: {@code application/pdf} (.pdf)
 *   <li>DOCX: {@code application/vnd.openxmlformats-officedocument.wordprocessingml.document} (.docx)
 *   <li>TXT: {@code text/plain} (.txt)
 * </ul>
 *
 * <p>Streams directly from storage (MinIO) without creating intermediate temporary files.
 * Preserves Tamil Unicode characters, agricultural numbers, scientific terms, and paragraph structures.
 */
@Slf4j
@Component
public class DocumentTextExtractor {

    public static final String MIME_PDF = "application/pdf";
    public static final String MIME_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    public static final String MIME_TXT = "text/plain";

    private static final Set<String> SUPPORTED_MIME_TYPES = Set.of(
            MIME_PDF,
            MIME_DOCX,
            MIME_TXT
    );

    private final Tika tika;

    public DocumentTextExtractor() {
        this.tika = new Tika();
        // Set maximum string length to prevent truncating large manuals (default is 100k)
        this.tika.setMaxStringLength(10 * 1024 * 1024); // 10MB
    }

    /**
     * Extracts raw text from an input stream.
     *
     * @param inputStream Document binary input stream
     * @param originalFilename Original source filename for format hinting and detection
     * @param declaredContentType Declared MIME type, if available
     * @return Extracted non-blank raw text
     * @throws DocumentExtractionException If format is unsupported, stream is unreadable, or no text can be extracted
     */
    public String extractText(InputStream inputStream, String originalFilename, String contentType) {
        if (inputStream == null) {
            throw new DocumentExtractionException("Document input stream cannot be null.");
        }

        BufferedInputStream bufferedStream = new BufferedInputStream(inputStream);
        String detectedMimeType = detectMimeType(bufferedStream, originalFilename, contentType);

        if (!isSupportedMimeType(detectedMimeType)) {
            log.warn("Rejected unsupported document format: detected='{}', filename='{}'", detectedMimeType, originalFilename);
            throw new DocumentExtractionException(
                    String.format("Unsupported document format '%s' for file '%s'. Supported formats are PDF, DOCX, and TXT.",
                            detectedMimeType, originalFilename != null ? originalFilename : "unknown"));
        }

        Metadata metadata = new Metadata();
        if (originalFilename != null && !originalFilename.isBlank()) {
            metadata.set(TikaCoreProperties.RESOURCE_NAME_KEY, originalFilename);
        }
        metadata.set(HttpHeaders.CONTENT_TYPE, detectedMimeType);

        try {
            log.debug("Extracting text from document: filename='{}', mimeType='{}'", originalFilename, detectedMimeType);
            String extracted = tika.parseToString(bufferedStream, metadata);

            if (extracted == null || extracted.isBlank()) {
                throw new DocumentExtractionException(
                        String.format("Document contains no extractable text: '%s'. Scanned image-only PDFs without an embedded text layer are not supported.",
                                originalFilename != null ? originalFilename : "unknown"));
            }

            log.info("Successfully extracted {} characters from '{}' (format: {})",
                    extracted.length(), originalFilename != null ? originalFilename : "stream", detectedMimeType);
            return extracted.trim();

        } catch (DocumentExtractionException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to parse document '{}': {}", originalFilename, e.getMessage(), e);
            throw new DocumentExtractionException(
                    String.format("Failed to extract text from document '%s': %s",
                            originalFilename != null ? originalFilename : "unknown", e.getMessage()), e);
        }
    }

    /**
     * Extracts raw text from document bytes.
     */
    public String extractText(byte[] documentBytes, String originalFilename, String contentType) {
        if (documentBytes == null || documentBytes.length == 0) {
            throw new DocumentExtractionException("Document content is empty or null.");
        }
        return extractText(new ByteArrayInputStream(documentBytes), originalFilename, contentType);
    }

    /**
     * Checks whether the given filename or MIME type corresponds to a supported document format.
     */
    public boolean isSupported(String originalFilename, String contentType) {
        if (contentType != null && isSupportedMimeType(contentType.trim().toLowerCase())) {
            return true;
        }
        if (originalFilename != null) {
            String lower = originalFilename.trim().toLowerCase();
            return lower.endsWith(".pdf") || lower.endsWith(".docx") || lower.endsWith(".txt");
        }
        return false;
    }

    public boolean isSupportedMimeType(String mimeType) {
        if (mimeType == null) {
            return false;
        }
        String clean = mimeType.trim().toLowerCase();
        // Allow text/plain with charset parameter e.g. text/plain; charset=UTF-8
        if (clean.startsWith(MIME_TXT)) {
            return true;
        }
        return SUPPORTED_MIME_TYPES.contains(clean);
    }

    /**
     * Detects MIME type from stream header and filename.
     */
    public String detectMimeType(InputStream stream, String filename, String declaredContentType) {
        try {
            Metadata metadata = new Metadata();
            if (filename != null && !filename.isBlank()) {
                metadata.set(TikaCoreProperties.RESOURCE_NAME_KEY, filename);
            }
            if (declaredContentType != null && !declaredContentType.isBlank()) {
                metadata.set(HttpHeaders.CONTENT_TYPE, declaredContentType);
            }
            return tika.detect(stream, metadata);
        } catch (Exception e) {
            log.warn("Could not automatically detect MIME type for '{}', falling back to declared/extension: {}",
                    filename, e.getMessage());
            if (declaredContentType != null && !declaredContentType.isBlank()) {
                return declaredContentType;
            }
            if (filename != null) {
                String lower = filename.toLowerCase();
                if (lower.endsWith(".pdf")) return MIME_PDF;
                if (lower.endsWith(".docx")) return MIME_DOCX;
                if (lower.endsWith(".txt")) return MIME_TXT;
            }
            return "application/octet-stream";
        }
    }
}
