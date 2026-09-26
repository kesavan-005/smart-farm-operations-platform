package com.smartfarm.common.api;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private T data;
    private ApiMeta meta;
    private ApiError error;

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .data(data)
                .meta(ApiMeta.builder().timestamp(java.time.Instant.now().toString()).build())
                .build();
    }

    public static <T> ApiResponse<T> success(T data, ApiMeta meta) {
        if (meta.getTimestamp() == null) {
            meta.setTimestamp(java.time.Instant.now().toString());
        }
        return ApiResponse.<T>builder().data(data).meta(meta).build();
    }

    public static <T> ApiResponse<T> error(ApiError error) {
        return ApiResponse.<T>builder().error(error).build();
    }
}
