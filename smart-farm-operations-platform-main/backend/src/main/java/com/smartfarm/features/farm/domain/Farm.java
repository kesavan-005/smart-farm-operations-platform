package com.smartfarm.features.farm.domain;

import com.smartfarm.features.auth.domain.User;
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

@Entity
@Table(name = "farms")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE farms SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@SQLRestriction("deleted = false")
public class Farm {
    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_user_id", nullable = false)
    private User owner;

    @Column(name = "farm_code", unique = true, nullable = false, length = 50)
    private String farmCode;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "name_ta", length = 100)
    private String nameTa;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "description_ta", columnDefinition = "TEXT")
    private String descriptionTa;

    @Column(name = "total_area")
    private BigDecimal totalArea;

    @Column(name = "area_unit", length = 10)
    private String areaUnit;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 100)
    private String village;

    @Column(length = 100)
    private String taluk;

    @Column(length = 100)
    private String district;

    @Column(nullable = false, length = 100)
    private String state;

    @Column(length = 20)
    private String pincode;

    private BigDecimal latitude;
    private BigDecimal longitude;

    @Column(name = "soil_type", length = 50)
    private String soilType;

    @Column(name = "soil_ph")
    private BigDecimal soilPh;

    @Column(name = "soil_organic_carbon")
    private BigDecimal soilOrganicCarbon;

    @Column(name = "irrigation_type", length = 50)
    private String irrigationType;

    @Column(name = "water_source", length = 50)
    private String waterSource;

    @Column(name = "water_availability", length = 100)
    private String waterAvailability;

    @Column(name = "drainage_type", length = 100)
    private String drainageType;

    @Column(name = "average_rainfall")
    private BigDecimal averageRainfall;

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
