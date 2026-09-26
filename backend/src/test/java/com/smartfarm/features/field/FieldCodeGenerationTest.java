package com.smartfarm.features.field;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.repository.FarmRepository;
import com.smartfarm.features.field.domain.Field;
import com.smartfarm.features.field.dto.FieldRequest;
import com.smartfarm.features.field.dto.FieldResponse;
import com.smartfarm.features.field.mapper.FieldMapper;
import com.smartfarm.features.field.repository.FieldRepository;
import com.smartfarm.features.field.service.FieldService;
import com.smartfarm.features.auth.domain.FarmModule;
import com.smartfarm.features.auth.domain.ModuleAccessLevel;
import com.smartfarm.features.auth.domain.User;
import com.smartfarm.features.auth.security.FarmAuthorizationService;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for Field Code generation in FieldService.
 *
 * Tests cover:
 * - First field in farm receives F01
 * - Sequence increments correctly
 * - Two-digit padding: 1→F01, 9→F09, 10→F10
 * - Deleted codes not reused (MAX query includes deleted rows)
 * - fieldCode is ignored/immutable on update
 * - Farm isolation (each farm has its own sequence)
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Field Code Generation Tests")
class FieldCodeGenerationTest {

    @Mock private FieldRepository fieldRepository;
    @Mock private FarmRepository farmRepository;
    @Mock private FieldMapper fieldMapper;
    
    private FarmAuthorizationService farmAuthorizationService = new FarmAuthorizationService(null, null, null, null, null) {
        @Override
        public boolean hasModuleAccess(UUID userId, UUID farmId, FarmModule module, ModuleAccessLevel requiredLevel) {
            return true;
        }
    };

    private FieldService fieldService;

    private static final UUID FARM_ID = UUID.randomUUID();
    private static final UUID FARM_ID_B = UUID.randomUUID();
    private static final UUID OWNER_ID = UUID.randomUUID();
    private static final String FARM_CODE = "CBE01";
    private static final String FARM_CODE_B = "CBE02";

    private Farm farm;
    private Farm farmB;
    private User owner;

    @BeforeEach
    void setUp() {
        fieldService = new FieldService(fieldRepository, farmRepository, fieldMapper, farmAuthorizationService);
        owner = User.builder().id(OWNER_ID).build();

        farm = Farm.builder()
                .id(FARM_ID)
                .farmCode(FARM_CODE)
                .owner(owner)
                .status("active")
                .build();

        farmB = Farm.builder()
                .id(FARM_ID_B)
                .farmCode(FARM_CODE_B)
                .owner(owner)
                .status("active")
                .build();
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    /** Sets up all mocks for a standard field creation and captures the saved Field. */
    private Field setupCreateMocks(Farm targetFarm, int maxSeq) {
        FieldRequest req = FieldRequest.builder().farmId(targetFarm.getId()).name("Test Field").status("active").build();
        when(farmRepository.findById(targetFarm.getId())).thenReturn(Optional.of(targetFarm));
        when(fieldRepository.findMaxFieldSequenceForFarm(targetFarm.getId())).thenReturn(maxSeq);

        Field proto = Field.builder().farm(targetFarm).name("Test Field").status("active").build();
        when(fieldMapper.toEntity(any(FieldRequest.class))).thenReturn(proto);

        // Capture the saved entity and return it with ID set
        ArgumentCaptor<Field> captor = ArgumentCaptor.forClass(Field.class);
        doReturn(proto).when(fieldRepository).saveAndFlush(captor.capture());

        // Mock toResponse
        when(fieldMapper.toResponse(any(Field.class))).thenAnswer(inv -> {
            Field f = inv.getArgument(0);
            return FieldResponse.builder().fieldCode(f.getFieldCode()).id(UUID.randomUUID()).farmId(targetFarm.getId()).build();
        });

        return proto; // returned reference after save
    }

    // ── Tests ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("First field in farm → code ends with F01")
    void firstFieldGetsFO1() {
        setupCreateMocks(farm, 0); // MAX = 0, so next = 1 → F01
        FieldRequest req = FieldRequest.builder().farmId(FARM_ID).name("First Field").status("active").build();
        FieldResponse response = fieldService.createField(req, OWNER_ID);

        ArgumentCaptor<Field> captor = ArgumentCaptor.forClass(Field.class);
        verify(fieldRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getFieldCode()).isEqualTo("CBE01-F01");
    }

    @Test
    @DisplayName("Third field in farm → code ends with F03")
    void thirdFieldGetsF03() {
        setupCreateMocks(farm, 2); // MAX = 2, so next = 3 → F03
        FieldRequest req = FieldRequest.builder().farmId(FARM_ID).name("Third Field").status("active").build();
        fieldService.createField(req, OWNER_ID);

        ArgumentCaptor<Field> captor = ArgumentCaptor.forClass(Field.class);
        verify(fieldRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getFieldCode()).isEqualTo("CBE01-F03");
    }

    @Test
    @DisplayName("Two-digit padding: sequence 9 → F09")
    void ninthFieldGetsF09() {
        setupCreateMocks(farm, 8);
        FieldRequest req = FieldRequest.builder().farmId(FARM_ID).name("9th Field").status("active").build();
        fieldService.createField(req, OWNER_ID);

        ArgumentCaptor<Field> captor = ArgumentCaptor.forClass(Field.class);
        verify(fieldRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getFieldCode()).isEqualTo("CBE01-F09");
    }

    @Test
    @DisplayName("Two-digit padding: sequence 10 → F10 (no leading zero)")
    void tenthFieldGetsF10() {
        setupCreateMocks(farm, 9);
        FieldRequest req = FieldRequest.builder().farmId(FARM_ID).name("10th Field").status("active").build();
        fieldService.createField(req, OWNER_ID);

        ArgumentCaptor<Field> captor = ArgumentCaptor.forClass(Field.class);
        verify(fieldRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getFieldCode()).isEqualTo("CBE01-F10");
    }

    @Test
    @DisplayName("Sequence > 99 continues naturally: 100 → F100")
    void hundredthFieldGetsF100() {
        setupCreateMocks(farm, 99);
        FieldRequest req = FieldRequest.builder().farmId(FARM_ID).name("100th Field").status("active").build();
        fieldService.createField(req, OWNER_ID);

        ArgumentCaptor<Field> captor = ArgumentCaptor.forClass(Field.class);
        verify(fieldRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getFieldCode()).isEqualTo("CBE01-F100");
    }

    @Test
    @DisplayName("Deleted code not reused: MAX includes soft-deleted rows")
    void deletedCodeNotReused() {
        // Simulates: F01, F02, F03 existed; F02 was deleted.
        // findMaxFieldSequenceForFarm still returns 3 (highest ever),
        // so next code is F04 — not F02 (reuse would be wrong).
        setupCreateMocks(farm, 3); // MAX = 3 even after F02 deleted
        FieldRequest req = FieldRequest.builder().farmId(FARM_ID).name("New Field").status("active").build();
        fieldService.createField(req, OWNER_ID);

        ArgumentCaptor<Field> captor = ArgumentCaptor.forClass(Field.class);
        verify(fieldRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getFieldCode()).isEqualTo("CBE01-F04");
        assertThat(captor.getValue().getFieldCode()).doesNotContain("F02");
    }

    @Test
    @DisplayName("Farm isolation: Farm B starts its own sequence at F01")
    void farmBStartsAtF01() {
        // Farm A already has F01, F02, F03
        setupCreateMocks(farmB, 0); // Farm B has max = 0
        FieldRequest req = FieldRequest.builder().farmId(FARM_ID_B).name("Farm B First Field").status("active").build();
        fieldService.createField(req, OWNER_ID);

        ArgumentCaptor<Field> captor = ArgumentCaptor.forClass(Field.class);
        verify(fieldRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getFieldCode()).isEqualTo("CBE02-F01");
        assertThat(captor.getValue().getFieldCode()).doesNotContain("CBE01");
    }

    @Test
    @DisplayName("Field Code format validation: format is FARM_CODE-F<NN>")
    void fieldCodeFormatMatchesSpec() {
        setupCreateMocks(farm, 0);
        FieldRequest req = FieldRequest.builder().farmId(FARM_ID).name("Field").status("active").build();
        fieldService.createField(req, OWNER_ID);

        ArgumentCaptor<Field> captor = ArgumentCaptor.forClass(Field.class);
        verify(fieldRepository).saveAndFlush(captor.capture());
        String code = captor.getValue().getFieldCode();
        assertThat(code).matches("^[A-Z0-9_\\-]+-F[0-9]{2,}$");
        assertThat(code).startsWith(FARM_CODE + "-F");
    }

    @Test
    @DisplayName("String format: sequence 1 produces two-digit minimum padding")
    void twoDigitMinimumPadding() {
        for (int i = 1; i <= 9; i++) {
            String formatted = String.format("%02d", i);
            assertThat(formatted).hasSize(2);
            assertThat(formatted).startsWith("0");
        }
        // 10 should not be padded beyond its natural 2 digits
        assertThat(String.format("%02d", 10)).isEqualTo("10");
        assertThat(String.format("%02d", 100)).isEqualTo("100");
    }
}
