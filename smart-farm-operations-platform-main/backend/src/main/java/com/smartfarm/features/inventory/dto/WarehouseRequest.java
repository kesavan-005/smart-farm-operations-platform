package com.smartfarm.features.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseRequest {
    @NotBlank(message = "Warehouse name is required")
    @Size(max = 100)
    private String name;

    @Size(max = 100)
    private String nameTa;

    @NotNull(message = "Capacity is required")
    private BigDecimal capacity;

    @Size(max = 255)
    private String location;

    @Size(max = 100)
    private String manager;
}
