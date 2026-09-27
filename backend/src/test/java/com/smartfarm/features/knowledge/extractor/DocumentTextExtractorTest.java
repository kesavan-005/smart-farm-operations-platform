package com.smartfarm.features.knowledge.extractor;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Phase 2.3 - Document Text Extractor Tests")
class DocumentTextExtractorTest {

    private DocumentTextExtractor extractor;

    @BeforeEach
    void setUp() {
        extractor = new DocumentTextExtractor();
    }

    @Nested
    @DisplayName("Plain Text (TXT) Extraction")
    class TxtExtractionTests {

        @Test
        @DisplayName("Should extract simple English text from TXT stream")
        void extractText_Txt_English() {
            String content = "TNAU Crop Protection Guide\nPaddy cultivation requires proper water management.";
            byte[] bytes = content.getBytes(StandardCharsets.UTF_8);

            String extracted = extractor.extractText(bytes, "guide.txt", "text/plain");

            assertThat(extracted).contains("TNAU Crop Protection Guide");
            assertThat(extracted).contains("Paddy cultivation requires proper water management.");
        }

        @Test
        @DisplayName("Should extract Tamil Unicode text from TXT stream")
        void extractText_Txt_Tamil() {
            String content = "தமிழ்நாடு வேளாண்மைப் பல்கலைக்கழகம்\nநெல் சாகுபடி தொழில்நுட்ப வழிகாட்டி - 2026";
            byte[] bytes = content.getBytes(StandardCharsets.UTF_8);

            String extracted = extractor.extractText(bytes, "tamil_paddy.txt", "text/plain");

            assertThat(extracted).contains("தமிழ்நாடு வேளாண்மைப் பல்கலைக்கழகம்");
            assertThat(extracted).contains("நெல் சாகுபடி தொழில்நுட்ப வழிகாட்டி - 2026");
        }

        @Test
        @DisplayName("Should preserve paragraph structure and numbers in TXT")
        void extractText_Txt_ParagraphsAndNumbers() {
            String content = "Section 1: Fertilizer Schedule\n\nApply DAP @ 50 kg/acre at 15 days.\n\nSection 2: Pest Control";
            byte[] bytes = content.getBytes(StandardCharsets.UTF_8);

            String extracted = extractor.extractText(bytes, "fertilizer.txt", "text/plain");

            assertThat(extracted).contains("Section 1: Fertilizer Schedule");
            assertThat(extracted).contains("50 kg/acre");
            assertThat(extracted).contains("Section 2: Pest Control");
        }
    }

    @Nested
    @DisplayName("PDF Document Extraction")
    class PdfExtractionTests {

        @Test
        @DisplayName("Should extract text from real PDF document")
        void extractText_Pdf_Success() throws IOException {
            byte[] pdfBytes = createSamplePdf("TNAU Agricultural Advisory Bulletin - Paddy Blast Management 2026");

            String extracted = extractor.extractText(pdfBytes, "bulletin.pdf", "application/pdf");

            assertThat(extracted).contains("TNAU Agricultural Advisory Bulletin");
            assertThat(extracted).contains("Paddy Blast Management 2026");
        }

        private byte[] createSamplePdf(String text) throws IOException {
            try (PDDocument doc = new PDDocument()) {
                PDPage page = new PDPage();
                doc.addPage(page);
                try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                    cs.beginText();
                    cs.setFont(PDType1Font.HELVETICA, 12);
                    cs.newLineAtOffset(50, 700);
                    cs.showText(text);
                    cs.endText();
                }
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                doc.save(baos);
                return baos.toByteArray();
            }
        }
    }

    @Nested
    @DisplayName("DOCX Document Extraction")
    class DocxExtractionTests {

        @Test
        @DisplayName("Should extract text from real DOCX document")
        void extractText_Docx_Success() throws IOException {
            byte[] docxBytes = createSampleDocx("ICAR National Rice Research Institute: Bacterial Blight Protocol");

            String extracted = extractor.extractText(
                    docxBytes,
                    "icar_protocol.docx",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

            assertThat(extracted).contains("ICAR National Rice Research Institute");
            assertThat(extracted).contains("Bacterial Blight Protocol");
        }

        private byte[] createSampleDocx(String text) throws IOException {
            try (XWPFDocument doc = new XWPFDocument()) {
                XWPFParagraph p = doc.createParagraph();
                p.createRun().setText(text);
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                doc.write(baos);
                return baos.toByteArray();
            }
        }
    }

    @Nested
    @DisplayName("Validation & Error Handling")
    class ErrorHandlingTests {

        @Test
        @DisplayName("Should reject unsupported file formats (e.g. .exe, .png)")
        void extractText_RejectsUnsupportedFormat() {
            byte[] exeBytes = "MZ...fake binary executable".getBytes(StandardCharsets.UTF_8);

            assertThatThrownBy(() -> extractor.extractText(exeBytes, "malware.exe", "application/x-msdownload"))
                    .isInstanceOf(DocumentExtractionException.class)
                    .hasMessageContaining("Unsupported document format");
        }

        @Test
        @DisplayName("Should reject empty document bytes")
        void extractText_RejectsEmptyBytes() {
            assertThatThrownBy(() -> extractor.extractText(new byte[0], "empty.txt", "text/plain"))
                    .isInstanceOf(DocumentExtractionException.class)
                    .hasMessageContaining("empty or null");
        }

        @Test
        @DisplayName("Should reject null input stream")
        void extractText_RejectsNullStream() {
            assertThatThrownBy(() -> extractor.extractText((InputStream) null, "doc.pdf", "application/pdf"))
                    .isInstanceOf(DocumentExtractionException.class)
                    .hasMessageContaining("stream cannot be null");
        }

        @Test
        @DisplayName("Should reject document containing only whitespace")
        void extractText_RejectsBlankContent() {
            byte[] blankBytes = "   \n\n  \t  \n".getBytes(StandardCharsets.UTF_8);

            assertThatThrownBy(() -> extractor.extractText(blankBytes, "blank.txt", "text/plain"))
                    .isInstanceOf(DocumentExtractionException.class)
                    .hasMessageContaining("no extractable text");
        }
    }

    @Nested
    @DisplayName("Format Support Verification")
    class FormatSupportTests {

        @Test
        @DisplayName("Should correctly identify supported extensions and MIME types")
        void isSupported_Checks() {
            assertThat(extractor.isSupported("guide.pdf", "application/pdf")).isTrue();
            assertThat(extractor.isSupported("doc.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")).isTrue();
            assertThat(extractor.isSupported("notes.txt", "text/plain")).isTrue();
            assertThat(extractor.isSupported("data.csv", "text/csv")).isFalse();
            assertThat(extractor.isSupported("script.sh", "application/x-sh")).isFalse();
        }
    }

    @Nested
    @DisplayName("Real Agricultural Seed PDF Extraction Compatibility")
    class RealAgriculturalSeedExtractionTests {

        @Test
        @DisplayName("Extract TNAU Blackgram Guide (Agriculture __ Home.pdf)")
        void extractTnauBlackgramGuide() throws Exception {
            java.nio.file.Path p = java.nio.file.Path.of("src/main/resources/knowledge-seed/tnau/Agriculture __ Home.pdf");
            try (InputStream is = java.nio.file.Files.newInputStream(p)) {
                String text = extractor.extractText(is, p.getFileName().toString(), "application/pdf");
                assertThat(text).isNotBlank();
                assertThat(text).contains("Blackgram");
                assertThat(text).contains("Vigna mungo");
            }
        }

        @Test
        @DisplayName("Extract TNAU Crop Production Guide 2012 (CPG 2012 (1).pdf)")
        void extractTnauCpg2012() throws Exception {
            java.nio.file.Path p = java.nio.file.Path.of("src/main/resources/knowledge-seed/tnau/CPG 2012 (1).pdf");
            try (InputStream is = java.nio.file.Files.newInputStream(p)) {
                String text = extractor.extractText(is, p.getFileName().toString(), "application/pdf");
                assertThat(text).isNotBlank();
                assertThat(text).contains("CROP PRODUCTION GUIDE");
                assertThat(text).contains("TAMIL NADU AGRICULTURAL UNIVERSITY");
            }
        }

        @Test
        @DisplayName("Extract TNAU LGP Based Crop Planning (LGP based crop planning_english.pdf)")
        void extractTnauLgpPlanning() throws Exception {
            java.nio.file.Path p = java.nio.file.Path.of("src/main/resources/knowledge-seed/tnau/LGP based crop planning_english.pdf");
            try (InputStream is = java.nio.file.Files.newInputStream(p)) {
                String text = extractor.extractText(is, p.getFileName().toString(), "application/pdf");
                assertThat(text).isNotBlank();
                assertThat(text).contains("Length of Growing Period based Cropping Pattern");
                assertThat(text).contains("Tamil Nadu Agricultural University");
            }
        }

        @Test
        @DisplayName("Extract ICAR Kharif English Edition (ICAR En-Kharif Agro-Advisories for Farmers 2025.pdf)")
        void extractIcarEnglishEdition() throws Exception {
            java.nio.file.Path p = java.nio.file.Path.of("src/main/resources/knowledge-seed/icar/ICAR En-Kharif Agro-Advisories for Farmers 2025.pdf");
            try (InputStream is = java.nio.file.Files.newInputStream(p)) {
                String text = extractor.extractText(is, p.getFileName().toString(), "application/pdf");
                assertThat(text).isNotBlank();
                assertThat(text).contains("Kharif Agro-Advisories");
                assertThat(text).contains("Indian Council of Agricultural Research");
            }
        }

        @Test
        @DisplayName("Extract ICAR Kharif Regional Edition (ICAR-Kharif-Agro-Advisories-for-Farmers-2025__multi-language (1).pdf)")
        void extractIcarRegionalEdition() throws Exception {
            java.nio.file.Path p = java.nio.file.Path.of("src/main/resources/knowledge-seed/icar/ICAR-Kharif-Agro-Advisories-for-Farmers-2025__multi-language (1).pdf");
            try (InputStream is = java.nio.file.Files.newInputStream(p)) {
                String text = extractor.extractText(is, p.getFileName().toString(), "application/pdf");
                assertThat(text).isNotBlank();
                assertThat(text).contains("Indian Council of Agricultural Research");
                // Verify Tamil characters are preserved in text extraction
                boolean hasTamil = text.chars().anyMatch(c -> c >= 0x0B80 && c <= 0x0BFF);
                assertThat(hasTamil).isTrue();
            }
        }
    }
}
