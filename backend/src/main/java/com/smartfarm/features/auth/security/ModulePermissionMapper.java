package com.smartfarm.features.auth.security;

import com.smartfarm.features.auth.domain.FarmModule;
import com.smartfarm.features.auth.domain.ModuleAccessLevel;
import java.util.Collections;
import java.util.Set;

public class ModulePermissionMapper {

    public static Set<String> getGranularPermissions(FarmModule module, ModuleAccessLevel level) {
        if (level == null || level == ModuleAccessLevel.NO_ACCESS) {
            return Collections.emptySet();
        }

        return switch (module) {
            case FARM_MANAGEMENT -> level == ModuleAccessLevel.VIEW_ONLY
                    ? Set.of("FARM_VIEW", "FIELD_VIEW", "CROP_VIEW")
                    : Set.of("FARM_VIEW", "FARM_UPDATE", "FIELD_VIEW", "FIELD_CREATE", "FIELD_UPDATE", "FIELD_DELETE", "CROP_VIEW", "CROP_CREATE", "CROP_UPDATE", "CROP_DELETE");

            case OPERATIONS -> level == ModuleAccessLevel.VIEW_ONLY
                    ? Set.of("ACTIVITY_VIEW", "TASK_VIEW", "CALENDAR_VIEW", "TIMELINE_VIEW")
                    : Set.of("ACTIVITY_VIEW", "ACTIVITY_CREATE", "ACTIVITY_UPDATE", "ACTIVITY_COMPLETE", "TASK_VIEW", "TASK_CREATE", "TASK_UPDATE", "TASK_ASSIGN", "TASK_COMPLETE", "CALENDAR_VIEW", "CALENDAR_CREATE", "CALENDAR_UPDATE");

            case MONITORING -> Set.of("WEATHER_VIEW");

            case INVENTORY -> level == ModuleAccessLevel.VIEW_ONLY
                    ? Set.of("INVENTORY_VIEW")
                    : Set.of("INVENTORY_VIEW", "INVENTORY_CREATE", "INVENTORY_UPDATE", "INVENTORY_USAGE", "INVENTORY_TRANSFER");

            case FINANCE -> level == ModuleAccessLevel.VIEW_ONLY
                    ? Set.of("FINANCE_VIEW")
                    : Set.of("FINANCE_VIEW", "FINANCE_CREATE", "FINANCE_UPDATE", "FINANCE_DELETE", "FINANCE_EXPORT");

            case AI_ADVISORY -> level == ModuleAccessLevel.VIEW_ONLY
                    ? Set.of("AI_RECOMMENDATION_VIEW", "AI_HISTORY_VIEW")
                    : Set.of("AI_RECOMMENDATION_VIEW", "AI_HISTORY_VIEW", "AI_ADVISORY_USE");

            case REPORTS -> level == ModuleAccessLevel.VIEW_ONLY
                    ? Set.of("REPORT_VIEW")
                    : Set.of("REPORT_VIEW", "REPORT_EXPORT");

            case NOTIFICATIONS -> level == ModuleAccessLevel.VIEW_ONLY
                    ? Set.of("NOTIFICATION_VIEW")
                    : Set.of("NOTIFICATION_VIEW", "NOTIFICATION_MANAGE");
        };
    }
}
