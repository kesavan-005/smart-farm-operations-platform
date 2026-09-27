# Phase 2.5 — Real Agricultural Document Intake & Metadata Report

**Project**: Uzhavan Smart Farm Operations Platform (RAG)  
**Backend**: `C:\Users\Dell\Desktop\smart-farm-operations-platform-RAG\backend`  
**Date**: September 27, 2026  
**Status**: INTAKE & METADATA PREPARATION COMPLETE (Production Ingestion Paused / Ready for Activation)

---

## 1. Discovered Source Files

The following 5 authoritative agricultural PDFs were discovered in `src/main/resources/knowledge-seed/`:

| Directory | Exact Filename | Size (Bytes) | Size (MB) | Format / Extension | SHA-256 Checksum |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `tnau/` | `Agriculture __ Home.pdf` | 290,266 | 0.28 MB | PDF (`.pdf`) | `0DA7E93CD6BE88C26BDCDE117F82EC61C87974A726AA6985044ABEA0C24C9DFE` |
| `tnau/` | `CPG 2012 (1).pdf` | 3,001,264 | 2.86 MB | PDF (`.pdf`) | `528B12F57479DC0F9ED798E9CF91F50717105D0D13A88E9DFEE20FD230DBC528` |
| `tnau/` | `LGP based crop planning_english.pdf` | 544,286 | 0.52 MB | PDF (`.pdf`) | `3E355681B14CDD81FE601F7574800D2E3EF62F2A0D73CFA1A7BC6EB59054A354` |
| `icar/` | `ICAR En-Kharif Agro-Advisories for Farmers 2025.pdf` | 17,831,258 | 17.00 MB | PDF (`.pdf`) | `E674CD3B6A214696D24D6876892CEE6FFAB3AE7E9499017F573C25690E1B901E` |
| `icar/` | `ICAR-Kharif-Agro-Advisories-for-Farmers-2025__multi-language (1).pdf` | 14,760,843 | 14.08 MB | PDF (`.pdf`) | `0C4A8144FE0E1676C628D7E039118AEB205ACB91A5DE5F3F3964197593EE2365` |

---

## 2. Document-by-Document Content & Metadata Analysis

### Document 1: `tnau/Agriculture __ Home.pdf`
- **Exact Title Verified From Document**: `Crop Production :: Pulses :: Blackgram (Vigna mungo L.)` (Web Title: `Agriculture :: Home`)
- **Authoring / Originating Organization**: Tamil Nadu Agricultural University (TNAU)
- **Publishing Organization**: Tamil Nadu Agricultural University Agritech Portal
- **Source / Authority**: Tamil Nadu Agricultural University (TNAU)
- **Source Type**: `AGRICULTURAL_UNIVERSITY`
- **Language**: `ENGLISH` (contains English narrative with transliterated Tamil season names: *Adipattam*, *Puratasipattam*, *Markazhi-Thaipattam*, *Chithiraipattam*)
- **Publication Date / Year**: `2013` (Explicitly on page: `© All Rights Reserved. TNAU-2013.`)
- **Edition / Version**: `2013`
- **Crops Covered**: `Blackgram` (*Vigna mungo L.*)
- **Topics Covered**: `CROP_MANAGEMENT` (Seasons & Varieties, Tillage, Nutrient Management, Irrigation Management, Weed Management, Crop Protection, Cost of Cultivation)
- **Source URL**: `https://agritech.tnau.ac.in/agriculture/pulses_blackgram.html` (Explicitly printed at bottom of page 3)
- **Text-Based or Scanned**: Text-based PDF (3 pages)
- **Extraction Compatibility**: PASS — 11,719 characters cleanly extracted via `DocumentTextExtractor` (Apache Tika). No corruption.

---

### Document 2: `tnau/CPG 2012 (1).pdf`
- **Exact Title Verified From Document**: `CROP PRODUCTION GUIDE - 2012`
- **Authoring / Originating Organization**: Jointly authored by Department of Agriculture, Government of Tamil Nadu and Tamil Nadu Agricultural University
- **Publishing Organization**: Dept. of Agriculture, Govt. of Tamil Nadu (Chennai) & TNAU (Coimbatore)
- **Source / Authority**: Department of Agriculture, Govt. of Tamil Nadu & TNAU
- **Source Type**: `AGRICULTURAL_UNIVERSITY` (Joint with `GOVERNMENT`)
- **Language**: `ENGLISH`
- **Publication Date / Year**: `2012` (Explicitly printed on cover and title pages)
- **Edition / Version**: `2012`
- **Crops Covered**: Multi-Crop (Rice, Millets, Pulses, Oilseeds, Fibres, Sugarcane, Sweet Sorghum, Tropical Sugarbeet, Forage Crops, Oyster Mushroom, Milky Mushroom, etc.)
- **Topics Covered**: `CROP_MANAGEMENT` (Comprehensive State Package of Practices, Cultivation, Soil-Related Constraints & Management, Chisel Technology, Surge Irrigation, Micro Irrigation, Agrometeorology, Farm Machinery & Implements, Post-Harvest Processing)
- **Source URL**: **NOT VERIFIED FROM DOCUMENT** (No canonical URL printed in publication)
- **Text-Based or Scanned**: Text-based PDF (388 pages)
- **Extraction Compatibility**: PASS — 916,676 characters cleanly extracted via `DocumentTextExtractor`. All agricultural terminology, dosage formulas, and tables preserved.

---

### Document 3: `tnau/LGP based crop planning_english.pdf`
- **Exact Title Verified From Document**: `Length of Growing Period based Cropping Pattern for different Agro-ecological Zones of Tamil Nadu`
- **Authoring / Originating Organization**: Department of Remote Sensing and GIS, Directorate of Natural Resource Management, TNAU, Coimbatore
- **Collaborating / Acknowledged Institutes**: Department of Agronomy, Agroclimate Research Centre, TNAU & National Bureau of Soil Survey and Land Use Planning (NBSS&LUP), Bangalore
- **Publishing Organization**: Tamil Nadu Agricultural University
- **Source / Authority**: Department of Remote Sensing and GIS, Directorate of Natural Resource Management, TNAU
- **Source Type**: `AGRICULTURAL_UNIVERSITY`
- **Language**: `ENGLISH`
- **Publication Date / Year**: `2011-10-01` (Publication Year 2011; Creation date 2011-10-21)
- **Edition / Version**: `Publication No. 2/2011` (Explicitly on cover and title pages)
- **Crops Covered**: Multi-Crop (Paddy, Sorghum, Millets, Pulses, Cotton, Groundnut, Sesame, Chillies, Tapioca, Sugarcane, Redgram, Vegetables, Turmeric, Sunflower, Banana, Casuarina)
- **Topics Covered**: `CROP_MANAGEMENT` (Agro-Ecological Zone Analysis, Soil Classification, Rainfall Distribution, Length of Growing Period, Double Cropping Suggestions)
- **Source URL**: `http://sites.tnau.ac.in/rsgis/` (Explicitly printed on page 25 under Acknowledgement)
- **Text-Based or Scanned**: Text-based PDF (29 pages)
- **Extraction Compatibility**: PASS — 67,672 characters cleanly extracted via `DocumentTextExtractor`.

---

### Document 4: `icar/ICAR En-Kharif Agro-Advisories for Farmers 2025.pdf`
- **Exact Title Verified From Document**: `ICAR Kharif Agro-Advisories for Farmers 2025`
- **Authoring / Originating Organization**: Indian Council of Agricultural Research (ICAR), New Delhi (Division of Agricultural Extension & ATARI Zone-I Ludhiana)
- **Publishing Organization**: Project Director, Directorate of Knowledge in Agriculture, ICAR, New Delhi
- **Source / Authority**: Indian Council of Agricultural Research (ICAR)
- **Source Type**: `RESEARCH_INSTITUTION`
- **Language**: `ENGLISH` (National English Edition; contains Hindi introductory message)
- **Publication Date / Year**: `2025-05-01` (Explicitly on page: `May 2025`)
- **Edition / Version**: `2025 (English Edition)`
- **ISBN**: `978-81-983602-6-7` (Explicitly verified on copyright page)
- **Crops Covered**: Multi-Crop (National Kharif Cereals, Pulses, Oilseeds, Commercial & Horticultural crops across all Indian States and Union Territories)
- **Topics Covered**: `WEATHER_RESPONSE` (Seasonal Weather Contingency Planning, Monsoon Response, Crop Sowing Windows, Reseeding, Stress Mitigation, Moisture Conservation)
- **Source URL**: **NOT VERIFIED FROM DOCUMENT**
- **Text-Based or Scanned**: Text-based PDF (310 pages)
- **Extraction Compatibility**: PASS — 1,637,451 characters cleanly extracted via `DocumentTextExtractor`. Technical terminology, chemical dosages, and state-wise advisories preserved.

---

### Document 5: `icar/ICAR-Kharif-Agro-Advisories-for-Farmers-2025__multi-language (1).pdf`
- **Exact Title Verified From Document**: `ICAR KHARIF AGRO-ADVISORY 2025 FOR FARMERS (Regional Languages Edition)` / `[kjhQ d`f”k ijke’kZ 2025 ¼{ks=h; Hkk”kk laLdj.k½`
- **Authoring / Originating Organization**: Indian Council of Agricultural Research (ICAR), New Delhi
- **Publishing Organization**: Project Director, Directorate of Knowledge in Agriculture, ICAR, New Delhi
- **Source / Authority**: Indian Council of Agricultural Research (ICAR)
- **Source Type**: `RESEARCH_INSTITUTION`
- **Language**: `MULTILINGUAL` (English, Hindi, and Regional Languages including **Tamil** for Tamil Nadu & Puducherry on pages 213–224, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Odia, Punjabi, Assamese)
- **Publication Date / Year**: `2025-05-01` (Explicitly stated: `May 2025 / ebZ 2025`)
- **Edition / Version**: `2025 (Regional Languages Edition)`
- **ISBN**: `978-81-7164-290-8` (Distinct ISBN from the English Edition)
- **Crops Covered**: Multi-Crop (State-wise Kharif crop advisories)
- **Topics Covered**: `WEATHER_RESPONSE` (State-specific regional agro-meteorological advisories for Kharif 2025)
- **Source URL**: **NOT VERIFIED FROM DOCUMENT**
- **Text-Based or Scanned**: Text-based PDF (294 pages)
- **Extraction Compatibility**: PASS — 1,560,451 characters cleanly extracted. Contains **4,874 Tamil word tokens** verified in Section 31 (Tamil Nadu & Puducherry). Tamil Unicode characters (U+0B80–U+0BFF) extracted intact.

---

## 3. Duplicate Analysis

| Comparison | Findings | Status |
| :--- | :--- | :--- |
| **Document 4 vs Document 5** | - Doc 4: English Edition (310 pages, 17.8 MB, ISBN: `978-81-983602-6-7`)<br>- Doc 5: Regional Languages Edition (294 pages, 14.8 MB, ISBN: `978-81-7164-290-8`, contains Tamil state advisory on pp. 213–224)<br>- Both share high-level structure but contain distinct language editions, page layouts, and regional advisory texts. | **DISTINCT EDITIONS (NOT DUPLICATE)** |
| **All other pairs** | Complete content diversity across Blackgram guide, 2012 CPG state manual, 2011 LGP zoning study, and 2025 ICAR advisories. | **NO DUPLICATES DETECTED** |

---

## 4. Metadata Uncertainties & Unverified Fields

In strict compliance with instructions:
- **`publishedDate` for all 5 documents**: Marked `null` (**NOT VERIFIED WITH DAY PRECISION FROM DOCUMENT**).
  - The documents establish publication year (2012, 2013) or publication month/year (October 2011, May 2025), but none establish an explicit calendar day.
  - To avoid inventing day precision (`YYYY-MM-01`), `publishedDate` is set to `null`.
  - The verified `publication_year` and `publication_month` are preserved inside the `metadata` JSON object.
- **`sourceUrl` for Document 2, 4, 5**: Marked `null` / **NOT VERIFIED FROM DOCUMENT** (No canonical URL printed within document body).
- **`lastVerifiedAt` for all documents**: Marked `null` / **NOT VERIFIED FROM DOCUMENT** (No runtime verification timestamp was present in the printed PDFs).
- **Single `crop` for Documents 2, 3, 4, 5**: Left `null` in manifest to avoid forcing a single crop on multi-crop encyclopedic manuals. Detailed crop lists are preserved in the `metadata` JSON object.

---

## 5. Final Seed Manifest (`manifest.json`)

File location: `backend/src/main/resources/knowledge-seed/manifest.json`

```json
{
  "documents": [
    {
      "filePath": "tnau/Agriculture __ Home.pdf",
      "originalFilename": "Agriculture __ Home.pdf",
      "contentType": "application/pdf",
      "title": "Crop Production - Pulses: Blackgram (Vigna mungo L.)",
      "source": "Tamil Nadu Agricultural University",
      "sourceType": "AGRICULTURAL_UNIVERSITY",
      "language": "ENGLISH",
      "crop": "Blackgram",
      "topic": "CROP_MANAGEMENT",
      "authority": "Tamil Nadu Agricultural University (TNAU)",
      "version": "2013",
      "publishedDate": null,
      "sourceUrl": "https://agritech.tnau.ac.in/agriculture/pulses_blackgram.html",
      "status": "ACTIVE",
      "metadata": "{\"category\":\"package_of_practices\",\"botanical_name\":\"Vigna mungo L.\",\"publication_year\":\"2013\"}"
    },
    {
      "filePath": "tnau/CPG 2012 (1).pdf",
      "originalFilename": "CPG 2012 (1).pdf",
      "contentType": "application/pdf",
      "title": "Crop Production Guide 2012",
      "source": "Department of Agriculture, Govt. of Tamil Nadu & Tamil Nadu Agricultural University",
      "sourceType": "AGRICULTURAL_UNIVERSITY",
      "language": "ENGLISH",
      "crop": null,
      "topic": "CROP_MANAGEMENT",
      "authority": "Department of Agriculture, Govt. of Tamil Nadu & TNAU",
      "version": "2012",
      "publishedDate": null,
      "sourceUrl": null,
      "status": "ACTIVE",
      "metadata": "{\"scope\":\"state_package_of_practices\",\"crops_covered\":\"multi_crop\",\"total_pages\":388,\"publication_year\":\"2012\"}"
    },
    {
      "filePath": "tnau/LGP based crop planning_english.pdf",
      "originalFilename": "LGP based crop planning_english.pdf",
      "contentType": "application/pdf",
      "title": "Length of Growing Period based Cropping Pattern for different Agro-ecological Zones of Tamil Nadu",
      "source": "Tamil Nadu Agricultural University",
      "sourceType": "AGRICULTURAL_UNIVERSITY",
      "language": "ENGLISH",
      "crop": null,
      "topic": "CROP_MANAGEMENT",
      "authority": "Department of Remote Sensing and GIS, Directorate of Natural Resource Management, TNAU",
      "version": "Publication No. 2/2011",
      "publishedDate": null,
      "sourceUrl": "http://sites.tnau.ac.in/rsgis/",
      "status": "ACTIVE",
      "metadata": "{\"publication_number\":\"2/2011\",\"collaborating_institutes\":\"Department of Agronomy, Agroclimate Research Centre, TNAU & NBSS&LUP Bangalore\",\"publication_month\":\"October\",\"publication_year\":\"2011\"}"
    },
    {
      "filePath": "icar/ICAR En-Kharif Agro-Advisories for Farmers 2025.pdf",
      "originalFilename": "ICAR En-Kharif Agro-Advisories for Farmers 2025.pdf",
      "contentType": "application/pdf",
      "title": "ICAR Kharif Agro-Advisories for Farmers 2025 (English Edition)",
      "source": "Indian Council of Agricultural Research, New Delhi",
      "sourceType": "RESEARCH_INSTITUTION",
      "language": "ENGLISH",
      "crop": null,
      "topic": "WEATHER_RESPONSE",
      "authority": "Division of Agricultural Extension & ATARI, ICAR, New Delhi",
      "version": "2025 (English Edition)",
      "publishedDate": null,
      "sourceUrl": null,
      "status": "ACTIVE",
      "metadata": "{\"isbn\":\"978-81-983602-6-7\",\"publisher\":\"Directorate of Knowledge in Agriculture, ICAR, New Delhi\",\"season\":\"Kharif 2025\",\"publication_month\":\"May\",\"publication_year\":\"2025\"}"
    },
    {
      "filePath": "icar/ICAR-Kharif-Agro-Advisories-for-Farmers-2025__multi-language (1).pdf",
      "originalFilename": "ICAR-Kharif-Agro-Advisories-for-Farmers-2025__multi-language (1).pdf",
      "contentType": "application/pdf",
      "title": "ICAR Kharif Agro-Advisory 2025 for Farmers (Regional Languages Edition)",
      "source": "Indian Council of Agricultural Research, New Delhi",
      "sourceType": "RESEARCH_INSTITUTION",
      "language": "MULTILINGUAL",
      "crop": null,
      "topic": "WEATHER_RESPONSE",
      "authority": "Division of Agricultural Extension & ATARI, ICAR, New Delhi",
      "version": "2025 (Regional Languages Edition)",
      "publishedDate": null,
      "sourceUrl": null,
      "status": "ACTIVE",
      "metadata": "{\"isbn\":\"978-81-7164-290-8\",\"publisher\":\"Directorate of Knowledge in Agriculture, ICAR, New Delhi\",\"season\":\"Kharif 2025\",\"publication_month\":\"May\",\"publication_year\":\"2025\",\"languages_included\":[\"English\",\"Hindi\",\"Tamil\",\"Telugu\",\"Bengali\",\"Marathi\",\"Gujarati\",\"Kannada\",\"Malayalam\",\"Odia\",\"Punjabi\",\"Assamese\"]}"
    }
  ]
}
```

---

## 6. Extraction Compatibility Verification

All 5 PDFs were exercised against `DocumentTextExtractor` via automated test suite `DocumentTextExtractorTest$RealAgriculturalSeedExtractionTests`:
- **0 errors or failures**.
- Total text volume across all 5 PDFs: **4,193,969 extracted characters**.
- None of the 5 files require OCR (all contain digital selectable text layers).
- Scanned / Image-Only: **0** (No files marked `OCR_REQUIRED`).
