# AI ADVISORY ERROR REPORT

## A. Current Status

- **AI Advisory**: NOT WORKING
- **HTTP status**: 503 Service Unavailable
- **Frontend Symptom**: Shows banner `"AI Advisory is temporarily unavailable. Please try again later."`

---

## B. Exact Root Cause

The AI Advisory fails during `chatModel.call(promptWithOptions)` in `AdvisoryOrchestrationService` because the active `ChatModel` bean (`OpenAiChatModel`) is configured with the dummy API key `"dummy-key"` due to a missing/empty `OPENAI_API_KEY` in the application runtime environment. 

When `chatModel.call(...)` contacts the OpenAI API (`https://api.openai.com/v1/chat/completions`), OpenAI rejects the request with an HTTP 401 Unauthorized / Invalid API Key error (`RestClientResponseException` / `NonTransientAiException`). 

`AdvisoryOrchestrationService.java` catches this exception at line 87 (`catch (Exception e)`) and wraps it into an `AdvisoryGenerationException("Failed to generate agricultural advisory due to an internal error.", e)`. `GlobalExceptionHandler` intercepts `AdvisoryGenerationException` and translates it into HTTP 503 Service Unavailable with JSON error code `"SERVICE_UNAVAILABLE"`.

---

## C. Original Exception

### Exception Class
`org.springframework.ai.retry.NonTransientAiException` (wrapping `org.springframework.web.client.HttpClientErrorException$Unauthorized: 401 Unauthorized: [Incorrect API key provided: dummy-key...]`)

### Stack Trace
```text
org.springframework.web.client.HttpClientErrorException$Unauthorized: 401 Unauthorized: "{"error":{"message":"Incorrect API key provided: dummy-key. You can find your API key at https://platform.openai.com/account/api-keys.","type":"invalid_request_error","param":null,"code":"invalid_api_key"}}"
	at org.springframework.web.client.DefaultRestClient$DefaultResponseSpec.readBody(DefaultRestClient.java:689)
	at org.springframework.web.client.DefaultRestClient$DefaultResponseSpec.toEntity(DefaultRestClient.java:645)
	at org.springframework.ai.openai.api.OpenAiApi.chatCompletionEntity(OpenAiApi.java:702)
	at org.springframework.ai.openai.OpenAiChatModel.call(OpenAiChatModel.java:185)
	at com.smartfarm.features.advisory.service.AdvisoryOrchestrationService.generateAdvisory(AdvisoryOrchestrationService.java:61)
	at com.smartfarm.features.advisory.controller.AdvisoryController.generateAdvisory(AdvisoryController.java:31)
```

---

## D. Exact Failure Location

- **File**: `backend/src/main/java/com/smartfarm/features/advisory/service/AdvisoryOrchestrationService.java`
- **Class**: `com.smartfarm.features.advisory.service.AdvisoryOrchestrationService`
- **Method**: `generateAdvisory(AdvisoryRequest request, UUID userId)`
- **Line**: Line 61: `ChatResponse chatResponse = chatModel.call(promptWithOptions);`
- **Exception Conversion**: Lines 87–90:
  ```java
  } catch (Exception e) {
      log.error("Failed to generate advisory", e);
      throw new AdvisoryGenerationException("Failed to generate agricultural advisory due to an internal error.", e);
  }
  ```
  followed by `GlobalExceptionHandler.java` (lines 115–123):
  ```java
  @ExceptionHandler(com.smartfarm.features.advisory.exception.AdvisoryGenerationException.class)
  public ResponseEntity<ApiResponse<Void>> handleAdvisoryGenerationException(AdvisoryGenerationException ex) {
      log.error("Advisory generation failed: {}", ex.getMessage());
      ApiError apiError = ApiError.builder()
              .code("SERVICE_UNAVAILABLE")
              .message("The AI advisory service is currently unavailable. Please try again later.")
              .build();
      return new ResponseEntity<>(ApiResponse.error(apiError), HttpStatus.SERVICE_UNAVAILABLE);
  }
  ```

---

## E. AI Provider

- **Provider**: OpenAI (`OpenAiChatModel`) via Spring AI. (Selected because `AI_PROVIDER` environment variable is unset, defaulting to `havingValue = "openai", matchIfMissing = true` in `AIProviderConfig.java`).
- **Model**: `gpt-4o-mini` (configured in `AIProviderConfig.java` line 45 and `application.yml` line 53).
- **Configuration**:
  - `application.yml`: `smartfarm.ai.llm.enabled: true`, `model: gpt-4o-mini`, `temperature: 0.2`
  - `AIProviderConfig.java`: instantiates `OpenAiChatModel` with `temperature: 0.7` overridden at runtime to `0.2`.
- **API Key Status**: **MISSING / NOT RESOLVED**. In the server startup log (`task-215.log`):
  ```text
  2026-09-22T21:18:09.883+05:30  INFO 8648 --- [smartfarm-api] [ main] c.s.f.advisory.config.AIProviderConfig : Initializing OpenAI ChatModel...
  2026-09-22T21:18:09.890+05:30  WARN 8648 --- [smartfarm-api] [ main] c.s.f.advisory.config.AIProviderConfig : OPENAI_API_KEY is not set or blank. Advisory requests will fail.
  ```
  Because neither `OPENAI_API_KEY` nor `GEMINI_API_KEY` is present in the environment or `.env`, `apiKey` fallback `"dummy-key"` was injected.

---

## F. Farm Context

Tracing `ContextAssembler.assemble(request, userId)` $\rightarrow$ `FarmContextService.getFarmContext(farmId, userId)`:

- **Farm data retrieval**: WORKING (Queries `FarmRepository.findByIdAndDeletedFalse(farmId)`).
- **Fields**: WORKING (Queries `FieldRepository.findByFarmId(farmId)`).
- **Crops**: WORKING (Queries `CropRepository.findByFieldFarmId(farmId)`).
- **Activities**: WORKING (Queries `ActivityRepository.findTop10ByFarmIdOrderByScheduledDateDesc(farmId)`).
- **Weather**: WORKING (Cached OpenWeatherMap response or stub).
- **Other context**: WORKING (Inventory stock alerts & Financial transactions retrieved successfully).
- **Status**: **WORKING**. The backend server logs show all SQL queries for farms, fields, crops, activities, inventory, and weather complete cleanly with HTTP 200 in sub-100ms before calling the LLM.

---

## G. Prompt Generation

- **Status**: **WORKING**.
- **Execution**:
  - `GroundedPromptBuilder.buildPrompt(context)` successfully serializes the `FarmContextResponse` into `<FARM_CONTEXT>`, maps the retrieved documents into `<AGRICULTURAL_KNOWLEDGE>`, weather into `<WEATHER>`, and user question into `<FARMER_QUESTION>`.
  - Generates a valid Spring AI `Prompt` object containing 1 `SystemMessage` (grounding rules) and 1 `UserMessage`.
- **Problem**: No exceptions thrown in prompt generation. (Vulnerability to XML boundary escaping exists as noted in audit issue H-07, but it does **not** cause the current 503 failure).

---

## H. RAG / PgVector

- **Is RAG called by the current advisory request?**: **YES**.
  - Path: `AdvisoryController` $\rightarrow$ `AdvisoryOrchestrationService.generateAdvisory` $\rightarrow$ `ContextAssembler.assemble` (line 68) $\rightarrow$ `KnowledgeRetrievalService.search(retrievalRequest)` $\rightarrow$ `PgVectorStore.similaritySearch(searchRequest)`.
- **Embedding model**: `TransformersEmbeddingModel` (`all-MiniLM-L6-v2` loaded locally via DJL ONNX runtime).
- **Embedding dimensions**: **384**.
- **Database vector dimensions**: **384** (in dev environment database table `public.vector_store`).
- **Mismatch in Dev Runtime**: None in dev runtime (`384 == 384`).
- **PgVector error during current runtime advisory request?**: **NO**.
  - During `KnowledgeRetrievalService.search()`, similarity search in `vector_store` succeeds. Because the table currently has 0 active knowledge documents in dev, it returns an empty list `[]` cleanly without throwing an exception.
  - *(Note: PgVector crashes with `ERROR: expected 384 dimensions, not 1536` only during production test ingestion or if `application-prod.yml` 1536-dim vectors are inserted into the dev table)*.

---

## I. Frontend AI Request

- **Endpoint**: `/api/v1/farms/{farmId}/advisory` (routed through Vite proxy to `http://localhost:8080/api/v1/farms/{farmId}/advisory`).
- **HTTP method**: `POST`
- **Request payload**:
  ```json
  {
    "question": "What about the farms?",
    "farmId": "f046e4e2-b421-4db9-9149-0c5fffc50cf0",
    "fieldId": undefined
  }
  ```
- **Response**: HTTP 503 Service Unavailable
  ```json
  {
    "success": false,
    "error": {
      "code": "SERVICE_UNAVAILABLE",
      "message": "The AI advisory service is currently unavailable. Please try again later."
    }
  }
  ```
- **Frontend error handling**: `AdvisoryWidget.tsx` catches `err.response.status === 503` (or `code === 'SERVICE_UNAVAILABLE'`) at line 94 and sets:
  ```typescript
  setError("AI Advisory is temporarily unavailable. Please try again later.");
  ```
  rendering the error banner in the UI.

---

## J. AI Test Results

| Test Class / Suite | Tests Run | Result | Root Cause |
|-------------------|-----------|--------|------------|
| `AdvisoryOrchestrationServiceTest` | 7 | **7 PASSED** (0 failed) | — (Uses mocked ChatModel and mock ContextAssembler) |
| `AdvisorySecurityIntegrationTest` | 26 | **24 PASSED, 2 ERRORS** | Vector store 384 vs 1536 dimension mismatch during test document ingestion |
| `RagEvaluationIntegrationTest` | 6 | **0 PASSED, 6 ERRORS** | Vector store 384 vs 1536 dimension mismatch (`expected 384 dimensions, not 1536`) |
| `AdvisoryPerformanceTest` | 8 | **0 PASSED, 8 ERRORS** | Vector store 384 vs 1536 dimension mismatch (`expected 384 dimensions, not 1536`) |
| `KnowledgeIngestionIntegrationTest` | 4 | **2 PASSED, 2 ERRORS** | Vector store 384 vs 1536 dimension mismatch on document chunk insertion |
| `KnowledgeRetrievalIntegrationTest` | 5 | **3 PASSED, 2 ERRORS** | Vector store 384 vs 1536 dimension mismatch on test fixture setup |

---

## K. ALL AI-RELATED ISSUES

### 🔴 CRITICAL
1. **Missing LLM Provider API Key (`OPENAI_API_KEY` / `GEMINI_API_KEY`)**:
   - `AIProviderConfig.java` falls back to `apiKey = "dummy-key"` when environment variables are missing.
   - Any chat request sent to the upstream LLM fails with HTTP 401 Unauthorized, caught and returned as HTTP 503.
2. **PgVector Embedding Dimension Conflict (384 vs 1536)**:
   - `VectorStoreConfig.java` and `application-dev.yml` use 384 dimensions (`all-MiniLM-L6-v2`), while `application-prod.yml` and integration tests specify 1536 dimensions (`text-embedding-3-small`). Inserting or querying 1536-dim vectors into a 384-dim column aborts with `PSQLException: expected 384 dimensions, not 1536`.

### 🟠 HIGH
3. **Invalid Google Gemini Model Identifier**:
   - `AIProviderConfig.java` (line 69) specifies `.model("gemini-3.5-flash")`. If `AI_PROVIDER=gemini` is activated, Google's API immediately returns HTTP 404/Invalid Model because `gemini-3.5-flash` does not exist (valid IDs are `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`).
4. **Advisory Hard Fails on LLM Errors (No Graceful Degradation)**:
   - When the LLM provider fails, `AdvisoryOrchestrationService` throws `AdvisoryGenerationException` which turns into HTTP 503. It does not provide a fallback rules-based response or inform the user of the exact provider connection issue.
5. **Prompt Delimiter Injection Vulnerability in `GroundedPromptBuilder`**:
   - Raw user input in `context.getQuestion()` is appended directly without escaping closing XML tags (`</FARMER_QUESTION>`).

### 🟡 MEDIUM
6. **Hardcoded In-Memory DJL ONNX Embedding Bean in Production**:
   - `AIProviderConfig.java` defines `@Bean public EmbeddingModel embeddingModel()` without `@ConditionalOnProperty`. It always boots the local DJL Transformers model even when running with `spring.ai.openai.embedding` configured in `application-prod.yml`.
7. **Missing Fallback when Vector Database is Down**:
   - If `vector_store` table or PgVector extension is corrupted, `ContextAssembler` fails inside `generateAdvisory` instead of falling back to general agricultural LLM advice with farm context alone.

### 🔵 LOW
8. **Temperature Inconsistency**:
   - `AIProviderConfig.java` configures `defaultOptions` with temperature `0.7`, but `AdvisoryOrchestrationService.java` overrides it to `properties.getTemperature()` (`0.2` in `application.yml`).

---

## L. Fix Priority

To resolve the 503 error and get AI Advisory working end-to-end:

1. **Step 1 — Provide a Valid AI Provider Credential**:
   - Supply a valid API key via environment variable:
     - For OpenAI: `OPENAI_API_KEY=sk-...`
     - OR For Google Gemini: `AI_PROVIDER=gemini` and `GEMINI_API_KEY=AIza...`
2. **Step 2 — Fix Model Identifier in `AIProviderConfig.java`**:
   - If using Gemini, correct `gemini-3.5-flash` to `gemini-1.5-flash`.
3. **Step 3 — Standardize PgVector Embedding Dimensions**:
   - Decide on a single embedding dimension: either 384 (local DJL `all-MiniLM-L6-v2`) or 1536 (OpenAI `text-embedding-3-small`) across all configurations (`application-dev.yml`, `application-prod.yml`, and `VectorStoreConfig.java`). Recreate or migrate `vector_store` table to match.
4. **Step 4 — Add LLM Error Handling & Fallback**:
   - In `AdvisoryOrchestrationService`, detect missing keys or upstream rate-limits/unauthorized errors and return a clean, descriptive message or fallback advisory rather than throwing an unhandled 503.

==================================================

AI INVESTIGATION COMPLETE — NO FILES MODIFIED.
