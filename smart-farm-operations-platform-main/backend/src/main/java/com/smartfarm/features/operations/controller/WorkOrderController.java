package com.smartfarm.features.operations.controller;

import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.repository.FarmRepository;
import com.smartfarm.features.operations.domain.WorkOrder;
import com.smartfarm.features.operations.dto.WorkOrderRequest;
import com.smartfarm.features.operations.dto.WorkOrderResponse;
import com.smartfarm.features.operations.mapper.OperationsMapper;
import com.smartfarm.features.operations.repository.WorkOrderRepository;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/work-orders")
public class WorkOrderController {

    @Autowired
    private WorkOrderRepository workOrderRepository;

    @Autowired
    private FarmRepository farmRepository;

    @Autowired
    private OperationsMapper operationsMapper;

    @GetMapping
    public ResponseEntity<List<WorkOrderResponse>> getWorkOrders(@RequestParam(required = false) UUID farmId) {
        List<WorkOrder> list;
        if (farmId != null) {
            list = workOrderRepository.findByFarmId(farmId);
        } else {
            list = workOrderRepository.findAll();
        }
        return ResponseEntity.ok(list.stream()
            .map(operationsMapper::toResponse)
            .collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkOrderResponse> getWorkOrderById(@PathVariable UUID id) {
        return workOrderRepository.findById(id)
            .map(operationsMapper::toResponse)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<WorkOrderResponse> createWorkOrder(@RequestBody WorkOrderRequest req) {
        Farm farm = farmRepository.findById(req.getFarmId())
            .orElseThrow(() -> new IllegalArgumentException("Invalid Farm ID"));

        WorkOrder wo = WorkOrder.builder()
            .farm(farm)
            .title(req.getTitle())
            .description(req.getDescription())
            .assignedTeam(req.getAssignedTeam())
            .status(req.getStatus())
            .estimatedCost(req.getEstimatedCost())
            .actualCost(req.getActualCost())
            .startDate(req.getStartDate())
            .completionDate(req.getCompletionDate())
            .build();

        WorkOrder saved = workOrderRepository.save(wo);
        return ResponseEntity.ok(operationsMapper.toResponse(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkOrderResponse> updateWorkOrder(@PathVariable UUID id, @RequestBody WorkOrderRequest req) {
        WorkOrder wo = workOrderRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("WorkOrder not found"));

        wo.setTitle(req.getTitle());
        wo.setDescription(req.getDescription());
        wo.setAssignedTeam(req.getAssignedTeam());
        wo.setStatus(req.getStatus());
        wo.setEstimatedCost(req.getEstimatedCost());
        wo.setActualCost(req.getActualCost());
        wo.setStartDate(req.getStartDate());
        wo.setCompletionDate(req.getCompletionDate());

        WorkOrder saved = workOrderRepository.save(wo);
        return ResponseEntity.ok(operationsMapper.toResponse(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkOrder(@PathVariable UUID id) {
        WorkOrder wo = workOrderRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("WorkOrder not found"));

        workOrderRepository.delete(wo);
        return ResponseEntity.ok().build();
    }
}
