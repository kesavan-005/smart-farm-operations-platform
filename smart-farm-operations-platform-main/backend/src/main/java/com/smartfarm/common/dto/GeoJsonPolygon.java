package com.smartfarm.common.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeoJsonPolygon {
    @NotNull
    @Pattern(regexp = "Polygon", message = "Type must be 'Polygon'")
    @Builder.Default
    private String type = "Polygon";

    @NotEmpty(message = "Coordinates cannot be empty")
    private List<List<List<Double>>> coordinates;
}
