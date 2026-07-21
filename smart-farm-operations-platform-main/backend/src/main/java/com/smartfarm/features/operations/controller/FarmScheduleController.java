package com.smartfarm.features.operations.controller;

import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.repository.FarmRepository;
import com.smartfarm.features.operations.domain.FarmSchedule;
import com.smartfarm.features.operations.dto.FarmScheduleRequest;
import com.smartfarm.features.operations.dto.FarmScheduleResponse;
import com.smartfarm.features.operations.mapper.OperationsMapper;
import com.smartfarm.features.operations.repository.FarmScheduleRepository;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/farm-schedules")
public class FarmScheduleController {

    @Autowired
    private FarmScheduleRepository farmScheduleRepository;

    @Autowired
    private FarmRepository farmRepository;

    @Autowired
    private OperationsMapper operationsMapper;

    @GetMapping
    public ResponseEntity<List<FarmScheduleResponse>> getFarmSchedules(@RequestParam(required = false) UUID farmId) {
        List<FarmSchedule> list;
        if (farmId != null) {
            list = farmScheduleRepository.findByFarmId(farmId);
        } else {
            list = farmScheduleRepository.findAll();
        }
        return ResponseEntity.ok(list.stream()
            .map(operationsMapper::toResponse)
            .collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FarmScheduleResponse> getFarmScheduleById(@PathVariable UUID id) {
        return farmScheduleRepository.findById(id)
            .map(operationsMapper::toResponse)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<FarmScheduleResponse> createFarmSchedule(@RequestBody FarmScheduleRequest req) {
        Farm farm = farmRepository.findById(req.getFarmId())
            .orElseThrow(() -> new IllegalArgumentException("Invalid Farm ID"));

        FarmSchedule fs = FarmSchedule.builder()
            .farm(farm)
            .title(req.getTitle())
            .description(req.getDescription())
            .startTime(req.getStartTime())
            .endTime(req.getEndTime())
            .recurrence(req.getRecurrence())
            .type(req.getType())
            .build();

        FarmSchedule saved = farmScheduleRepository.save(fs);
        return ResponseEntity.ok(operationsMapper.toResponse(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FarmScheduleResponse> updateFarmSchedule(@PathVariable UUID id, @RequestBody FarmScheduleRequest req) {
        FarmSchedule fs = farmScheduleRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("FarmSchedule not found"));

        fs.setTitle(req.getTitle());
        fs.setDescription(req.getDescription());
        fs.setStartTime(req.getStartTime());
        fs.setEndTime(req.getEndTime());
        fs.setRecurrence(req.getRecurrence());
        fs.setType(req.getType());

        FarmSchedule saved = farmScheduleRepository.save(fs);
        return ResponseEntity.ok(operationsMapper.toResponse(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFarmSchedule(@PathVariable UUID id) {
        FarmSchedule fs = farmScheduleRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("FarmSchedule not found"));

        farmScheduleRepository.delete(fs);
        return ResponseEntity.ok().build();
    }
}
