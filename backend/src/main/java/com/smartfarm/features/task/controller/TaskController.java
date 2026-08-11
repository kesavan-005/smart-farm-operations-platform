package com.smartfarm.features.task.controller;

import com.smartfarm.common.api.ApiResponse;
import com.smartfarm.features.task.domain.*;
import java.util.List;
import com.smartfarm.features.task.dto.TaskRequest;
import com.smartfarm.features.task.dto.TaskResponse;
import com.smartfarm.features.task.service.TaskService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping("/api/v1/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TaskResponse> createTask(
            @Valid @RequestBody TaskRequest request,
            @AuthenticationPrincipal UUID userId) {
        TaskResponse response = taskService.createTask(request, userId);
        return ApiResponse.success(response);
    }

    @GetMapping("/api/v1/tasks/{id}")
    public ApiResponse<TaskResponse> getTaskById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        TaskResponse response = taskService.getTaskById(id, userId);
        return ApiResponse.success(response);
    }

    @GetMapping("/api/v1/tasks")
    public ApiResponse<Page<TaskResponse>> getTasks(
            @RequestParam(required = false) UUID farmId,
            @RequestParam(required = false) UUID fieldId,
            @RequestParam(required = false) UUID activityId,
            @RequestParam(required = false) UUID assignedUserId,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection,
            @AuthenticationPrincipal UUID userId) {

        Sort sort = sortDirection.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<TaskResponse> response = taskService.getAllTasks(
                farmId, fieldId, activityId, assignedUserId, status, priority, search, pageable, userId
        );
        return ApiResponse.success(response);
    }

    @PutMapping("/api/v1/tasks/{id}")
    public ApiResponse<TaskResponse> updateTask(
            @PathVariable UUID id,
            @Valid @RequestBody TaskRequest request,
            @AuthenticationPrincipal UUID userId) {
        TaskResponse response = taskService.updateTask(id, request, userId);
        return ApiResponse.success(response);
    }

    @DeleteMapping("/api/v1/tasks/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> deleteTask(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        taskService.deleteTask(id, userId);
        return ApiResponse.success(null);
    }

    // Special Endpoints
    @GetMapping("/api/v1/activities/{activityId}/tasks")
    public ApiResponse<Page<TaskResponse>> getTasksByActivity(
            @PathVariable UUID activityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UUID userId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<TaskResponse> response = taskService.getAllTasks(
                null, null, activityId, null, null, null, null, pageable, userId
        );
        return ApiResponse.success(response);
    }

    @GetMapping("/api/v1/farms/{farmId}/tasks")
    public ApiResponse<Page<TaskResponse>> getTasksByFarm(
            @PathVariable UUID farmId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UUID userId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<TaskResponse> response = taskService.getAllTasks(
                farmId, null, null, null, null, null, null, pageable, userId
        );
        return ApiResponse.success(response);
    }

    @GetMapping("/api/v1/users/{userId}/tasks")
    public ApiResponse<Page<TaskResponse>> getTasksByUser(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UUID currentUserId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<TaskResponse> response = taskService.getAllTasks(
                null, null, null, userId, null, null, null, pageable, currentUserId
        );
        return ApiResponse.success(response);
    }

    @GetMapping("/api/v1/tasks/{id}/comments")
    public ApiResponse<List<TaskComment>> getComments(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        List<TaskComment> response = taskService.getComments(id, userId);
        return ApiResponse.success(response);
    }

    @PostMapping("/api/v1/tasks/{id}/comments")
    public ApiResponse<TaskComment> addComment(
            @PathVariable UUID id,
            @RequestBody String commentText,
            @AuthenticationPrincipal UUID userId) {
        TaskComment response = taskService.addComment(id, commentText, userId);
        return ApiResponse.success(response);
    }

    @GetMapping("/api/v1/tasks/{id}/checklist")
    public ApiResponse<List<TaskChecklist>> getChecklist(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        List<TaskChecklist> response = taskService.getChecklist(id, userId);
        return ApiResponse.success(response);
    }

    @PostMapping("/api/v1/tasks/{id}/checklist")
    public ApiResponse<TaskChecklist> addChecklistItem(
            @PathVariable UUID id,
            @RequestParam String itemName,
            @AuthenticationPrincipal UUID userId) {
        TaskChecklist response = taskService.addChecklistItem(id, itemName, userId);
        return ApiResponse.success(response);
    }

    @PutMapping("/api/v1/tasks/{id}/checklist/{itemId}/toggle")
    public ApiResponse<TaskChecklist> toggleChecklistItem(
            @PathVariable UUID id,
            @PathVariable UUID itemId,
            @AuthenticationPrincipal UUID userId) {
        TaskChecklist response = taskService.toggleChecklistItem(id, itemId, userId);
        return ApiResponse.success(response);
    }

    @DeleteMapping("/api/v1/tasks/{id}/checklist/{itemId}")
    public ApiResponse<Void> deleteChecklistItem(
            @PathVariable UUID id,
            @PathVariable UUID itemId,
            @AuthenticationPrincipal UUID userId) {
        taskService.deleteChecklistItem(id, itemId, userId);
        return ApiResponse.success(null);
    }

    @GetMapping("/api/v1/tasks/{id}/attachments")
    public ApiResponse<List<TaskAttachment>> getAttachments(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        List<TaskAttachment> response = taskService.getAttachments(id, userId);
        return ApiResponse.success(response);
    }

    @PostMapping("/api/v1/tasks/{id}/attachments")
    public ApiResponse<TaskAttachment> addAttachment(
            @PathVariable UUID id,
            @RequestParam String url,
            @RequestParam(required = false) String fileName,
            @AuthenticationPrincipal UUID userId) {
        TaskAttachment response = taskService.addAttachment(id, url, fileName, userId);
        return ApiResponse.success(response);
    }

    @GetMapping("/api/v1/tasks/{id}/history")
    public ApiResponse<List<TaskHistory>> getHistory(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        List<TaskHistory> response = taskService.getHistory(id, userId);
        return ApiResponse.success(response);
    }
}
