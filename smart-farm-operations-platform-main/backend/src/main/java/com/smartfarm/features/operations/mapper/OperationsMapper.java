package com.smartfarm.features.operations.mapper;

import com.smartfarm.features.operations.domain.*;
import com.smartfarm.features.operations.dto.*;
import org.springframework.stereotype.Component;

@Component
public class OperationsMapper {

    public EquipmentResponse toResponse(Equipment e) {
        if (e == null) return null;
        EquipmentResponse res = new EquipmentResponse();
        res.setId(e.getId());
        res.setName(e.getName());
        res.setType(e.getType());
        res.setStatus(e.getStatus());
        res.setLastMaintenanceDate(e.getLastMaintenanceDate());
        res.setCreatedAt(e.getCreatedAt());
        res.setUpdatedAt(e.getUpdatedAt());
        if (e.getFarm() != null) {
            res.setFarmId(e.getFarm().getId());
            res.setFarmName(e.getFarm().getName());
        }
        return res;
    }

    public WorkOrderResponse toResponse(WorkOrder w) {
        if (w == null) return null;
        WorkOrderResponse res = new WorkOrderResponse();
        res.setId(w.getId());
        res.setTitle(w.getTitle());
        res.setDescription(w.getDescription());
        res.setAssignedTeam(w.getAssignedTeam());
        res.setStatus(w.getStatus());
        res.setEstimatedCost(w.getEstimatedCost());
        res.setActualCost(w.getActualCost());
        res.setStartDate(w.getStartDate());
        res.setCompletionDate(w.getCompletionDate());
        res.setCreatedAt(w.getCreatedAt());
        res.setUpdatedAt(w.getUpdatedAt());
        if (w.getFarm() != null) {
            res.setFarmId(w.getFarm().getId());
            res.setFarmName(w.getFarm().getName());
        }
        return res;
    }

    public LaborRecordResponse toResponse(LaborRecord lr) {
        if (lr == null) return null;
        LaborRecordResponse res = new LaborRecordResponse();
        res.setId(lr.getId());
        res.setRecordDate(lr.getRecordDate());
        res.setStatus(lr.getStatus());
        res.setCheckIn(lr.getCheckIn());
        res.setCheckOut(lr.getCheckOut());
        res.setWorkingHours(lr.getWorkingHours());
        res.setProductivityScore(lr.getProductivityScore());
        res.setRemarks(lr.getRemarks());
        res.setCreatedAt(lr.getCreatedAt());
        res.setUpdatedAt(lr.getUpdatedAt());
        if (lr.getFarm() != null) {
            res.setFarmId(lr.getFarm().getId());
            res.setFarmName(lr.getFarm().getName());
        }
        if (lr.getWorker() != null) {
            res.setWorkerId(lr.getWorker().getId());
            res.setWorkerName(lr.getWorker().getName());
            res.setWorkerPhone(lr.getWorker().getPhone());
        }
        return res;
    }

    public FarmScheduleResponse toResponse(FarmSchedule fs) {
        if (fs == null) return null;
        FarmScheduleResponse res = new FarmScheduleResponse();
        res.setId(fs.getId());
        res.setTitle(fs.getTitle());
        res.setDescription(fs.getDescription());
        res.setStartTime(fs.getStartTime());
        res.setEndTime(fs.getEndTime());
        res.setRecurrence(fs.getRecurrence());
        res.setType(fs.getType());
        res.setCreatedAt(fs.getCreatedAt());
        res.setUpdatedAt(fs.getUpdatedAt());
        if (fs.getFarm() != null) {
            res.setFarmId(fs.getFarm().getId());
            res.setFarmName(fs.getFarm().getName());
        }
        return res;
    }
}
