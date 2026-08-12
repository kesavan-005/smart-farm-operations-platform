package com.smartfarm.common.api;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiMeta {
    private String timestamp;
    private String correlationId;
    private PaginationMeta pagination;
}
