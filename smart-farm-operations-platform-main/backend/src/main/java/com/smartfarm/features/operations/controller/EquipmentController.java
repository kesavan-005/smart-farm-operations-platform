package com.smartfarm.features.operations.controller;

import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.repository.FarmRepository;
import com.smartfarm.features.operations.domain.Equipment;
import com.smartfarm.features.operations.dto.EquipmentRequest;
import com.smartfarm.features.operations.dto.EquipmentResponse;
import com.smartfarm.features.operations.mapper.OperationsMapper;
import com.smartfarm.features.operations.repository.EquipmentRepository;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/equipment")
public class EquipmentController {

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private FarmRepository farmRepository;

    @Autowired
    private OperationsMapper operationsMapper;

    @GetMapping
    public ResponseEntity<List<EquipmentResponse>> getEquipment(@RequestParam(required = false) UUID farmId) {
        List<Equipment> list;
        if (farmId != null) {
            list = equipmentRepository.findByFarmId(farmId);
        } else {
            list = equipmentRepository.findAll();
        }
        return ResponseEntity.ok(list.stream()
            .map(operationsMapper::toResponse)
            .collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EquipmentResponse> getEquipmentById(@PathVariable UUID id) {
        return equipmentRepository.findById(id)
            .map(operationsMapper::toResponse)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<EquipmentResponse> createEquipment(@RequestBody EquipmentRequest req) {
        Farm farm = farmRepository.findById(req.getFarmId())
            .orElseThrow(() -> new IllegalArgumentException("Invalid Farm ID"));

        Equipment eq = Equipment.builder()
            .farm(farm)
            .name(req.getName())
            .type(req.getType())
            .status(req.getStatus())
            .lastMaintenanceDate(req.getLastMaintenanceDate())
            .build();

        Equipment saved = equipmentRepository.save(eq);
        return ResponseEntity.ok(operationsMapper.toResponse(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EquipmentResponse> updateEquipment(@PathVariable UUID id, @RequestBody EquipmentRequest req) {
        Equipment eq = equipmentRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Equipment not found"));

        eq.setName(req.getName());
        eq.setType(req.getType());
        eq.setStatus(req.getStatus());
        eq.setLastMaintenanceDate(req.getLastMaintenanceDate());

        Equipment saved = equipmentRepository.save(eq);
        return ResponseEntity.ok(operationsMapper.toResponse(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEquipment(@PathVariable UUID id) {
        Equipment eq = equipmentRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Equipment not found"));

        equipmentRepository.delete(eq);
        return ResponseEntity.ok().build();
    }
}
