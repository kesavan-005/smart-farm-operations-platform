package com.smartfarm.features.operations.controller;

import com.smartfarm.features.auth.domain.User;
import com.smartfarm.features.auth.repository.UserRepository;
import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.repository.FarmRepository;
import com.smartfarm.features.operations.domain.LaborRecord;
import com.smartfarm.features.operations.dto.LaborRecordRequest;
import com.smartfarm.features.operations.dto.LaborRecordResponse;
import com.smartfarm.features.operations.mapper.OperationsMapper;
import com.smartfarm.features.operations.repository.LaborRecordRepository;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/labor-records")
public class LaborRecordController {

    @Autowired
    private LaborRecordRepository laborRecordRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FarmRepository farmRepository;

    @Autowired
    private OperationsMapper operationsMapper;

    @GetMapping
    public ResponseEntity<List<LaborRecordResponse>> getLaborRecords(@RequestParam(required = false) UUID farmId) {
        List<LaborRecord> list;
        if (farmId != null) {
            list = laborRecordRepository.findByFarmId(farmId);
        } else {
            list = laborRecordRepository.findAll();
        }
        return ResponseEntity.ok(list.stream()
            .map(operationsMapper::toResponse)
            .collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LaborRecordResponse> getLaborRecordById(@PathVariable UUID id) {
        return laborRecordRepository.findById(id)
            .map(operationsMapper::toResponse)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<LaborRecordResponse> createLaborRecord(@RequestBody LaborRecordRequest req) {
        Farm farm = farmRepository.findById(req.getFarmId())
            .orElseThrow(() -> new IllegalArgumentException("Invalid Farm ID"));
        User worker = userRepository.findById(req.getWorkerId())
            .orElseThrow(() -> new IllegalArgumentException("Invalid Worker ID"));

        LaborRecord lr = laborRecordRepository.findByWorkerIdAndRecordDate(worker.getId(), req.getRecordDate())
            .orElse(null);

        if (lr == null) {
            lr = LaborRecord.builder()
                .farm(farm)
                .worker(worker)
                .recordDate(req.getRecordDate())
                .status(req.getStatus())
                .checkIn(req.getCheckIn())
                .checkOut(req.getCheckOut())
                .workingHours(req.getWorkingHours())
                .productivityScore(req.getProductivityScore())
                .remarks(req.getRemarks())
                .build();
        } else {
            lr.setStatus(req.getStatus());
            lr.setCheckIn(req.getCheckIn());
            lr.setCheckOut(req.getCheckOut());
            lr.setWorkingHours(req.getWorkingHours());
            lr.setProductivityScore(req.getProductivityScore());
            lr.setRemarks(req.getRemarks());
        }

        LaborRecord saved = laborRecordRepository.save(lr);
        return ResponseEntity.ok(operationsMapper.toResponse(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LaborRecordResponse> updateLaborRecord(@PathVariable UUID id, @RequestBody LaborRecordRequest req) {
        LaborRecord lr = laborRecordRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Labor record not found"));

        lr.setStatus(req.getStatus());
        lr.setCheckIn(req.getCheckIn());
        lr.setCheckOut(req.getCheckOut());
        lr.setWorkingHours(req.getWorkingHours());
        lr.setProductivityScore(req.getProductivityScore());
        lr.setRemarks(req.getRemarks());

        LaborRecord saved = laborRecordRepository.save(lr);
        return ResponseEntity.ok(operationsMapper.toResponse(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLaborRecord(@PathVariable UUID id) {
        LaborRecord lr = laborRecordRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Labor record not found"));

        laborRecordRepository.delete(lr);
        return ResponseEntity.ok().build();
    }
}
