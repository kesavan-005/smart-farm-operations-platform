package com.smartfarm.features.field.domain;

import com.smartfarm.features.farm.domain.Farm;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UpdateTimestamp;
import org.locationtech.jts.geom.Polygon;

@Entity
@Table(name = "fields")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE fields SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@SQLRestriction("deleted = false")
public class Field {
    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @Column(name = "field_code", unique = true, nullable = false, length = 50)
    private String fieldCode;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "name_ta", length = 100)
    private String nameTa;

    private BigDecimal area;

    @Column(name = "area_unit", length = 10)
    private String areaUnit;

    @Column(columnDefinition = "geometry(Polygon, 4326)")
    private Polygon boundary;

    @Column(name = "soil_type", length = 50)
    private String soilType;

    @Column(name = "soil_ph")
    private BigDecimal soilPh;

    @Column(name = "soil_organic_carbon")
    private BigDecimal soilOrganicCarbon;

    @Column(name = "irrigation_type", length = 50)
    private String irrigationType;

    @Column(name = "water_availability", length = 100)
    private String waterAvailability;

    @Column(name = "drainage_type", length = 100)
    private String drainageType;

    @Column(name = "average_rainfall")
    private BigDecimal averageRainfall;

    private BigDecimal elevation;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "notes_ta", columnDefinition = "TEXT")
    private String notesTa;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "active";

    @Builder.Default
    private boolean deleted = false;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
