package com.smartfarm.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.smartfarm.features.auth.domain.User;
import com.smartfarm.features.auth.domain.Role;
import com.smartfarm.features.auth.domain.UserFarmRole;
import com.smartfarm.features.auth.repository.UserRepository;
import com.smartfarm.features.auth.repository.UserFarmRoleRepository;

import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.repository.FarmRepository;

import com.smartfarm.features.field.domain.Field;
import com.smartfarm.features.field.repository.FieldRepository;

import com.smartfarm.features.crop.domain.Crop;
import com.smartfarm.features.crop.repository.CropRepository;

import com.smartfarm.features.activity.domain.Activity;
import com.smartfarm.features.activity.domain.ActivityType;
import com.smartfarm.features.activity.domain.ActivityStatus;
import com.smartfarm.features.activity.domain.ActivityPriority;
import com.smartfarm.features.activity.repository.ActivityRepository;

import com.smartfarm.features.finance.domain.FinancialTransaction;
import com.smartfarm.features.finance.repository.FinancialTransactionRepository;

import com.smartfarm.features.inventory.domain.InventoryItem;
import com.smartfarm.features.inventory.repository.InventoryItemRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@Profile("dev")
public class SeedDataRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FarmRepository farmRepository;
    private final UserFarmRoleRepository userFarmRoleRepository;
    private final FieldRepository fieldRepository;
    private final CropRepository cropRepository;
    private final ActivityRepository activityRepository;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final InventoryItemRepository inventoryItemRepository;

    public SeedDataRunner(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            FarmRepository farmRepository,
            UserFarmRoleRepository userFarmRoleRepository,
            FieldRepository fieldRepository,
            CropRepository cropRepository,
            ActivityRepository activityRepository,
            FinancialTransactionRepository financialTransactionRepository,
            InventoryItemRepository inventoryItemRepository
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.farmRepository = farmRepository;
        this.userFarmRoleRepository = userFarmRoleRepository;
        this.fieldRepository = fieldRepository;
        this.cropRepository = cropRepository;
        this.activityRepository = activityRepository;
        this.financialTransactionRepository = financialTransactionRepository;
        this.inventoryItemRepository = inventoryItemRepository;
    }

    @Override
    public void run(String... args) {
        log.info("Running dev seed data...");

        // 1. Seed default admin user if missing
        Optional<User> adminOpt = userRepository.findByEmailAndDeletedAtIsNull("mahechosol2235@gmail.com");
        if (adminOpt.isEmpty()) {
            User admin = User.builder()
                .firstName("Mahesh")
                .lastName("Chosol")
                .name("Mahesh Chosol")
                .username("mahechosol2235")
                .email("mahechosol2235@gmail.com")
                .phone("+919876543200")
                .passwordHash(passwordEncoder.encode("Password@123"))
                .role(Role.ADMIN)
                .preferredLanguage("en")
                .isActive(true)
                .isVerified(true)
                .build();
            userRepository.save(admin);
            log.info("Seeded default admin user: mahechosol2235@gmail.com / Password@123");
        } else {
            User admin = adminOpt.get();
            if ("+919876543210".equals(admin.getPhone())) {
                admin.setPhone("+919876543200");
                userRepository.save(admin);
                log.info("Updated admin phone to +919876543200 to free +919876543210 for Ramesh");
            }
        }

        // ==========================================
        // 2. SEED DEMO USER 1: hari.kesavan
        // ==========================================
        seedHariKesavan();

        // ==========================================
        // 3. SEED DEMO USER 2: ramesh (Ramesh Kumar)
        // ==========================================
        seedRameshKumar();
    }

    private void seedHariKesavan() {
        Optional<User> hariOpt = userRepository.findByUsernameAndDeletedAtIsNull("hari.kesavan");
        User hariUser;
        if (hariOpt.isEmpty()) {
            hariUser = User.builder()
                .firstName("Hari")
                .lastName("Kesavan")
                .name("Hari Kesavan")
                .username("hari.kesavan")
                .email("hari.kesavan@uzhavan.demo")
                .phone("+919876543211")
                .passwordHash(passwordEncoder.encode("Hari@2026"))
                .role(Role.FARM_OWNER)
                .preferredLanguage("en")
                .isActive(true)
                .isVerified(true)
                .build();
            hariUser = userRepository.save(hariUser);
            log.info("Seeded demo user: hari.kesavan / Hari@2026");
        } else {
            hariUser = hariOpt.get();
            if (!passwordEncoder.matches("Hari@2026", hariUser.getPasswordHash())) {
                hariUser.setPasswordHash(passwordEncoder.encode("Hari@2026"));
                hariUser = userRepository.save(hariUser);
                log.info("Updated password hash for demo user hari.kesavan");
            }
        }
        final User hari = hariUser;

        Optional<Farm> farmOpt = farmRepository.findByFarmCode("FARM-HARI-01");
        Farm farmObj;
        if (farmOpt.isEmpty()) {
            farmObj = Farm.builder()
                .owner(hari)
                .farmCode("FARM-HARI-01")
                .name("Uzhavan Demo Farm")
                .nameTa("உழவன் மாதிரி பண்ணை")
                .description("Demo 4-acre farm in Anaimalai, Pollachi, Coimbatore, Tamil Nadu.")
                .descriptionTa("பொள்ளாச்சி ஆனைமலையில் அமைந்துள்ள மாதிரி பண்ணை.")
                .totalArea(new BigDecimal("4.00"))
                .areaUnit("acres")
                .address("Anaimalai Village, Pollachi Taluk")
                .village("Anaimalai")
                .taluk("Pollachi")
                .district("Coimbatore")
                .state("Tamil Nadu")
                .pincode("642104")
                .latitude(new BigDecimal("10.5843"))
                .longitude(new BigDecimal("76.9328"))
                .soilType("Red Loamy Soil")
                .irrigationType("Borewell")
                .waterSource("Borewell")
                .status("active")
                .build();
            farmObj = farmRepository.save(farmObj);

            hari.setFarmId(farmObj.getId());
            userRepository.save(hari);
            log.info("Seeded demo farm: Uzhavan Demo Farm (ID: {})", farmObj.getId());
        } else {
            farmObj = farmOpt.get();
            if (hari.getFarmId() == null || !hari.getFarmId().equals(farmObj.getId())) {
                hari.setFarmId(farmObj.getId());
                userRepository.save(hari);
            }
        }
        final Farm farm = farmObj;
        final UUID targetFarmId = farm.getId();

        List<UserFarmRole> ufrList = userFarmRoleRepository.findByUserId(hari.getId());
        boolean hasRole = ufrList.stream().anyMatch(r -> targetFarmId.equals(r.getFarmId()));
        if (!hasRole) {
            UserFarmRole ufr = UserFarmRole.builder()
                .user(hari)
                .farmId(targetFarmId)
                .role(Role.WORKER)
                .build();
            userFarmRoleRepository.save(ufr);
        }

        Optional<Field> northOpt = fieldRepository.findByFieldCode("FIELD-HARI-01");
        Field northField = northOpt.orElseGet(() -> fieldRepository.save(Field.builder()
                .farm(farm)
                .fieldCode("FIELD-HARI-01")
                .name("North Field")
                .nameTa("வடக்கு வயல்")
                .area(new BigDecimal("2.00"))
                .areaUnit("acres")
                .soilType("Red Loamy Soil")
                .irrigationType("Borewell")
                .status("active")
                .build()));

        Optional<Field> southOpt = fieldRepository.findByFieldCode("FIELD-HARI-02");
        Field southField = southOpt.orElseGet(() -> fieldRepository.save(Field.builder()
                .farm(farm)
                .fieldCode("FIELD-HARI-02")
                .name("South Field")
                .nameTa("தெற்கு வயல்")
                .area(new BigDecimal("2.00"))
                .areaUnit("acres")
                .soilType("Red Loamy Soil")
                .irrigationType("Borewell")
                .status("active")
                .build()));

        Optional<Crop> paddyOpt = cropRepository.findFirstByField_IdAndStatusAndDeletedFalseOrderBySowingDateDesc(northField.getId(), "active");
        Crop paddyCrop = paddyOpt.orElseGet(() -> cropRepository.save(Crop.builder()
                .field(northField)
                .name("Paddy")
                .nameTa("நெல்")
                .variety("CO 51")
                .season("Samba")
                .sowingDate(LocalDate.now().minusDays(45))
                .expectedHarvestDate(LocalDate.now().plusDays(75))
                .plantingMethod("Transplanting")
                .expectedYield(new BigDecimal("5.00"))
                .yieldUnit("tons")
                .status("active")
                .build()));

        Optional<Crop> turmericOpt = cropRepository.findFirstByField_IdAndStatusAndDeletedFalseOrderBySowingDateDesc(southField.getId(), "active");
        Crop turmericCrop = turmericOpt.orElseGet(() -> cropRepository.save(Crop.builder()
                .field(southField)
                .name("Turmeric")
                .nameTa("மஞ்சள்")
                .variety("CO 2")
                .season("Annual")
                .sowingDate(LocalDate.now().minusDays(90))
                .expectedHarvestDate(LocalDate.now().plusDays(180))
                .plantingMethod("Rhizome Planting")
                .expectedYield(new BigDecimal("8.00"))
                .yieldUnit("tons")
                .status("active")
                .build()));

        Specification<Activity> activitySpec = (root, query, cb) -> cb.equal(root.get("farm").get("id"), targetFarmId);
        if (activityRepository.findAll(activitySpec).isEmpty()) {
            activityRepository.save(Activity.builder()
                .title("Borewell Irrigation - North Field")
                .description("Regular borewell irrigation for Paddy crop")
                .activityType(ActivityType.IRRIGATION)
                .status(ActivityStatus.COMPLETED)
                .priority(ActivityPriority.MEDIUM)
                .farm(farm).field(northField).crop(paddyCrop).performedBy(hari)
                .scheduledDate(OffsetDateTime.now().minusDays(5)).completedDate(OffsetDateTime.now().minusDays(5)).createdBy(hari).build());

            activityRepository.save(Activity.builder()
                .title("Urea Application - Paddy")
                .description("Top dressing of Urea 25kg")
                .activityType(ActivityType.FERTILIZER)
                .status(ActivityStatus.COMPLETED)
                .priority(ActivityPriority.MEDIUM)
                .farm(farm).field(northField).crop(paddyCrop).performedBy(hari)
                .scheduledDate(OffsetDateTime.now().minusDays(10)).completedDate(OffsetDateTime.now().minusDays(10)).createdBy(hari).build());

            activityRepository.save(Activity.builder()
                .title("Turmeric Rhizome Inspection")
                .description("Checked root health and soil moisture levels in South Field")
                .activityType(ActivityType.INSPECTION)
                .status(ActivityStatus.COMPLETED)
                .priority(ActivityPriority.LOW)
                .farm(farm).field(southField).crop(turmericCrop).performedBy(hari)
                .scheduledDate(OffsetDateTime.now().minusDays(3)).completedDate(OffsetDateTime.now().minusDays(3)).createdBy(hari).build());

            activityRepository.save(Activity.builder()
                .title("Weeding & Earthing Up - South Field")
                .description("Manual weeding around turmeric plants")
                .activityType(ActivityType.MAINTENANCE)
                .status(ActivityStatus.PLANNED)
                .priority(ActivityPriority.MEDIUM)
                .farm(farm).field(southField).crop(turmericCrop).performedBy(hari)
                .scheduledDate(OffsetDateTime.now().plusDays(3)).createdBy(hari).build());

            activityRepository.save(Activity.builder()
                .title("Pest Inspection - North Field Paddy")
                .description("Check for stem borer infestation symptoms")
                .activityType(ActivityType.INSPECTION)
                .status(ActivityStatus.PLANNED)
                .priority(ActivityPriority.HIGH)
                .farm(farm).field(northField).crop(paddyCrop).performedBy(hari)
                .scheduledDate(OffsetDateTime.now().minusDays(2)).createdBy(hari).build());
        }

        if (financialTransactionRepository.findByFarmIdAndDeletedFalseOrderByTransactionDateDesc(targetFarmId).isEmpty()) {
            financialTransactionRepository.save(FinancialTransaction.builder().farm(farm).transactionType("EXPENSE").category("FERTILIZER_PURCHASE").amount(new BigDecimal("3500.00")).description("Purchased Urea & DAP from Co-op Society").paymentMethod("CASH").status("COMPLETED").transactionDate(OffsetDateTime.now().minusDays(8)).build());
            financialTransactionRepository.save(FinancialTransaction.builder().farm(farm).transactionType("EXPENSE").category("SEED_PURCHASE").amount(new BigDecimal("2400.00")).description("Paddy CO 51 Seeds & Turmeric Rhizomes").paymentMethod("UPI").status("COMPLETED").transactionDate(OffsetDateTime.now().minusDays(20)).build());
            financialTransactionRepository.save(FinancialTransaction.builder().farm(farm).transactionType("EXPENSE").category("PAYROLL").amount(new BigDecimal("4500.00")).description("Field Preparation & Sowing Labour Charges").paymentMethod("CASH").status("COMPLETED").transactionDate(OffsetDateTime.now().minusDays(12)).build());
            financialTransactionRepository.save(FinancialTransaction.builder().farm(farm).transactionType("EXPENSE").category("FUEL").amount(new BigDecimal("1800.00")).description("Electricity & Pump Maintenance for Irrigation").paymentMethod("UPI").status("COMPLETED").transactionDate(OffsetDateTime.now().minusDays(4)).build());
            financialTransactionRepository.save(FinancialTransaction.builder().farm(farm).transactionType("EXPENSE").category("OTHER").amount(new BigDecimal("1200.00")).description("Tool Sharpening & General Fencing Repair").paymentMethod("CASH").status("COMPLETED").transactionDate(OffsetDateTime.now().minusDays(2)).build());
        }

        if (inventoryItemRepository.findByFarmIdAndDeletedFalse(targetFarmId).isEmpty()) {
            inventoryItemRepository.save(InventoryItem.builder().farm(farm).name("Urea Fertilizer").nameTa("யுரியா உரம்").sku("SKU-UREA-01").currentQuantity(new BigDecimal("50.00")).minimumStock(new BigDecimal("20.00")).unit("kg").cost(new BigDecimal("300.00")).supplier("Coimbatore Agro Feeds").status("active").build());
            inventoryItemRepository.save(InventoryItem.builder().farm(farm).name("DAP Fertilizer").nameTa("டி.ஏ.பி உரம்").sku("SKU-DAP-01").currentQuantity(new BigDecimal("5.00")).minimumStock(new BigDecimal("10.00")).unit("kg").cost(new BigDecimal("1350.00")).supplier("Coimbatore Agro Feeds").status("active").build());
            inventoryItemRepository.save(InventoryItem.builder().farm(farm).name("Organic Manure").nameTa("இயற்கை உரம்").sku("SKU-MANURE-01").currentQuantity(new BigDecimal("500.00")).minimumStock(new BigDecimal("100.00")).unit("kg").cost(new BigDecimal("5.00")).supplier("Local Organic Depot").status("active").build());
            inventoryItemRepository.save(InventoryItem.builder().farm(farm).name("Paddy CO 51 Seeds").nameTa("விதை நெல் CO 51").sku("SKU-PADDY-SEED-01").currentQuantity(new BigDecimal("25.00")).minimumStock(new BigDecimal("10.00")).unit("kg").cost(new BigDecimal("85.00")).supplier("TNAU Seed Centre").status("active").build());
        }

        log.info("=== SEEDING COMPLETED FOR HARI KESAVAN ===");
    }

    private void seedRameshKumar() {
        // Ensure phone +919876543210 is free for ramesh
        Optional<User> phoneHolder = userRepository.findByPhoneAndDeletedAtIsNull("+919876543210");
        if (phoneHolder.isPresent() && !"ramesh".equalsIgnoreCase(phoneHolder.get().getUsername())) {
            User oldUser = phoneHolder.get();
            oldUser.setPhone("+919876543200");
            userRepository.save(oldUser);
            log.info("Reassigned phone +919876543200 to previous phone holder {}", oldUser.getUsername());
        }

        // 1. Seed / Update Demo User: ramesh (Ramesh Kumar)
        Optional<User> rameshOpt = userRepository.findByUsernameAndDeletedAtIsNull("ramesh");
        User rameshUser;
        if (rameshOpt.isEmpty()) {
            rameshUser = User.builder()
                .firstName("Ramesh")
                .lastName("Kumar")
                .name("Ramesh Kumar")
                .username("ramesh")
                .email("ramesh@uzhavan.demo")
                .phone("+919876543210")
                .passwordHash(passwordEncoder.encode("Ramesh@2026"))
                .role(Role.FARM_OWNER)
                .preferredLanguage("ta")
                .isActive(true)
                .isVerified(true)
                .build();
            rameshUser = userRepository.save(rameshUser);
            log.info("Seeded demo user: ramesh / Ramesh@2026");
        } else {
            rameshUser = rameshOpt.get();
            if (!passwordEncoder.matches("Ramesh@2026", rameshUser.getPasswordHash())) {
                rameshUser.setPasswordHash(passwordEncoder.encode("Ramesh@2026"));
            }
            if (!"+919876543210".equals(rameshUser.getPhone())) {
                rameshUser.setPhone("+919876543210");
            }
            rameshUser = userRepository.save(rameshUser);
            log.info("Updated demo user ramesh info / password hash");
        }
        final User ramesh = rameshUser;

        // 2. Seed / Get Demo Farm: Ramesh Uzhavan Farm
        Optional<Farm> farmOpt = farmRepository.findByFarmCode("FARM-RAMESH-01");
        Farm farmObj;
        if (farmOpt.isEmpty()) {
            farmObj = Farm.builder()
                .owner(ramesh)
                .farmCode("FARM-RAMESH-01")
                .name("Ramesh Uzhavan Farm")
                .nameTa("ரமேஷ் உழவன் பண்ணை")
                .description("Demo 5-acre farm in Anaimalai, Pollachi, Coimbatore, Tamil Nadu.")
                .descriptionTa("பொள்ளாச்சி ஆனைமலையில் அமைந்துள்ள 5 ஏக்கர் மாதிரி பண்ணை.")
                .totalArea(new BigDecimal("5.00"))
                .areaUnit("acres")
                .address("Anaimalai Village, Pollachi Taluk")
                .village("Anaimalai")
                .taluk("Pollachi")
                .district("Coimbatore")
                .state("Tamil Nadu")
                .pincode("642104")
                .latitude(new BigDecimal("10.5843"))
                .longitude(new BigDecimal("76.9328"))
                .soilType("Red Loamy Soil")
                .irrigationType("Borewell")
                .waterSource("Borewell")
                .waterAvailability("Good")
                .status("active")
                .build();
            farmObj = farmRepository.save(farmObj);

            ramesh.setFarmId(farmObj.getId());
            userRepository.save(ramesh);
            log.info("Seeded demo farm: Ramesh Uzhavan Farm (ID: {})", farmObj.getId());
        } else {
            farmObj = farmOpt.get();
            if (ramesh.getFarmId() == null || !ramesh.getFarmId().equals(farmObj.getId())) {
                ramesh.setFarmId(farmObj.getId());
                userRepository.save(ramesh);
            }
        }
        final Farm farm = farmObj;
        final UUID targetFarmId = farm.getId();

        // 3. UserFarmRole
        List<UserFarmRole> ufrList = userFarmRoleRepository.findByUserId(ramesh.getId());
        boolean hasRole = ufrList.stream().anyMatch(r -> targetFarmId.equals(r.getFarmId()));
        if (!hasRole) {
            UserFarmRole ufr = UserFarmRole.builder()
                .user(ramesh)
                .farmId(targetFarmId)
                .role(Role.WORKER)
                .build();
            userFarmRoleRepository.save(ufr);
            log.info("Linked user ramesh to farm Ramesh Uzhavan Farm");
        }

        // 4. Seed Fields: North Field (2 acres), South Field (2 acres), East Field (1 acre)
        Optional<Field> northOpt = fieldRepository.findByFieldCode("FIELD-RAMESH-01");
        Field northField = northOpt.orElseGet(() -> fieldRepository.save(Field.builder()
                .farm(farm)
                .fieldCode("FIELD-RAMESH-01")
                .name("North Field")
                .nameTa("வடக்கு வயல்")
                .area(new BigDecimal("2.00"))
                .areaUnit("acres")
                .soilType("Red Loamy Soil")
                .irrigationType("Borewell")
                .status("active")
                .build()));

        Optional<Field> southOpt = fieldRepository.findByFieldCode("FIELD-RAMESH-02");
        Field southField = southOpt.orElseGet(() -> fieldRepository.save(Field.builder()
                .farm(farm)
                .fieldCode("FIELD-RAMESH-02")
                .name("South Field")
                .nameTa("தெற்கு வயல்")
                .area(new BigDecimal("2.00"))
                .areaUnit("acres")
                .soilType("Red Loamy Soil")
                .irrigationType("Borewell")
                .status("active")
                .build()));

        Optional<Field> eastOpt = fieldRepository.findByFieldCode("FIELD-RAMESH-03");
        Field eastField = eastOpt.orElseGet(() -> fieldRepository.save(Field.builder()
                .farm(farm)
                .fieldCode("FIELD-RAMESH-03")
                .name("East Field")
                .nameTa("கிழக்கு வயல்")
                .area(new BigDecimal("1.00"))
                .areaUnit("acres")
                .soilType("Red Loamy Soil")
                .irrigationType("Borewell")
                .status("active")
                .build()));

        // 5. Seed Crops: Paddy (CO 51), Turmeric (CO 2), Tomato (Arka Rakshak)
        Optional<Crop> paddyOpt = cropRepository.findFirstByField_IdAndStatusAndDeletedFalseOrderBySowingDateDesc(northField.getId(), "active");
        Crop paddyCrop = paddyOpt.orElseGet(() -> cropRepository.save(Crop.builder()
                .field(northField)
                .name("Paddy")
                .nameTa("நெல்")
                .variety("CO 51")
                .season("Samba")
                .sowingDate(LocalDate.now().minusDays(45))
                .expectedHarvestDate(LocalDate.now().plusDays(75))
                .plantingMethod("Transplanting")
                .expectedYield(new BigDecimal("5.00"))
                .yieldUnit("tons")
                .status("active")
                .build()));

        Optional<Crop> turmericOpt = cropRepository.findFirstByField_IdAndStatusAndDeletedFalseOrderBySowingDateDesc(southField.getId(), "active");
        Crop turmericCrop = turmericOpt.orElseGet(() -> cropRepository.save(Crop.builder()
                .field(southField)
                .name("Turmeric")
                .nameTa("மஞ்சள்")
                .variety("CO 2")
                .season("Annual")
                .sowingDate(LocalDate.now().minusDays(90))
                .expectedHarvestDate(LocalDate.now().plusDays(180))
                .plantingMethod("Rhizome Planting")
                .expectedYield(new BigDecimal("8.00"))
                .yieldUnit("tons")
                .status("active")
                .build()));

        Optional<Crop> tomatoOpt = cropRepository.findFirstByField_IdAndStatusAndDeletedFalseOrderBySowingDateDesc(eastField.getId(), "active");
        Crop tomatoCrop = tomatoOpt.orElseGet(() -> cropRepository.save(Crop.builder()
                .field(eastField)
                .name("Tomato")
                .nameTa("தக்காளி")
                .variety("Arka Rakshak")
                .season("Kharif")
                .sowingDate(LocalDate.now().minusDays(30))
                .expectedHarvestDate(LocalDate.now().plusDays(60))
                .plantingMethod("Transplanting")
                .expectedYield(new BigDecimal("12.00"))
                .yieldUnit("tons")
                .status("active")
                .build()));

        // 6. Seed Activities: Irrigation, Fertilizer, Weed Management, Inspection, Overdue Pest Observation, Labour
        Specification<Activity> activitySpec = (root, query, cb) -> cb.equal(root.get("farm").get("id"), targetFarmId);
        if (activityRepository.findAll(activitySpec).isEmpty()) {
            // 1. Irrigation (Completed)
            activityRepository.save(Activity.builder()
                .title("Borewell Irrigation - North Field")
                .description("Regular borewell irrigation for Paddy crop")
                .activityType(ActivityType.IRRIGATION)
                .status(ActivityStatus.COMPLETED)
                .priority(ActivityPriority.MEDIUM)
                .farm(farm).field(northField).crop(paddyCrop).performedBy(ramesh)
                .scheduledDate(OffsetDateTime.now().minusDays(5)).completedDate(OffsetDateTime.now().minusDays(5)).createdBy(ramesh).build());

            // 2. Fertilizer Application (Completed)
            activityRepository.save(Activity.builder()
                .title("Urea Application - Paddy")
                .description("Top dressing of Urea fertiliser")
                .activityType(ActivityType.FERTILIZER)
                .status(ActivityStatus.COMPLETED)
                .priority(ActivityPriority.MEDIUM)
                .farm(farm).field(northField).crop(paddyCrop).performedBy(ramesh)
                .scheduledDate(OffsetDateTime.now().minusDays(10)).completedDate(OffsetDateTime.now().minusDays(10)).createdBy(ramesh).build());

            // 3. Field Inspection (Completed)
            activityRepository.save(Activity.builder()
                .title("Turmeric Rhizome Inspection")
                .description("Checked root health and moisture levels in South Field")
                .activityType(ActivityType.INSPECTION)
                .status(ActivityStatus.COMPLETED)
                .priority(ActivityPriority.LOW)
                .farm(farm).field(southField).crop(turmericCrop).performedBy(ramesh)
                .scheduledDate(OffsetDateTime.now().minusDays(3)).completedDate(OffsetDateTime.now().minusDays(3)).createdBy(ramesh).build());

            // 4. Weed Management (Planned / Pending)
            activityRepository.save(Activity.builder()
                .title("Weeding & Earthing Up - South Field")
                .description("Manual weeding around turmeric plants")
                .activityType(ActivityType.MAINTENANCE)
                .status(ActivityStatus.PLANNED)
                .priority(ActivityPriority.MEDIUM)
                .farm(farm).field(southField).crop(turmericCrop).performedBy(ramesh)
                .scheduledDate(OffsetDateTime.now().plusDays(3)).createdBy(ramesh).build());

            // 5. Pest Observation (Overdue -> triggers Attention Item!)
            activityRepository.save(Activity.builder()
                .title("Pest Inspection - East Field Tomato")
                .description("Check for leaf miner and early blight infestation in tomato plot")
                .activityType(ActivityType.INSPECTION)
                .status(ActivityStatus.PLANNED)
                .priority(ActivityPriority.HIGH)
                .farm(farm).field(eastField).crop(tomatoCrop).performedBy(ramesh)
                .scheduledDate(OffsetDateTime.now().minusDays(2)).createdBy(ramesh).build());

            // 6. Labour Activity (Completed)
            activityRepository.save(Activity.builder()
                .title("Staking & Trellising - Tomato")
                .description("Erected bamboo stakes and ropes for tomato vine support")
                .activityType(ActivityType.PLANTING)
                .status(ActivityStatus.COMPLETED)
                .priority(ActivityPriority.MEDIUM)
                .farm(farm).field(eastField).crop(tomatoCrop).performedBy(ramesh)
                .scheduledDate(OffsetDateTime.now().minusDays(7)).completedDate(OffsetDateTime.now().minusDays(7)).createdBy(ramesh).build());

            log.info("Seeded 6 demo activities for Ramesh Uzhavan Farm");
        }

        // 7. Seed Expenses (Current Month)
        if (financialTransactionRepository.findByFarmIdAndDeletedFalseOrderByTransactionDateDesc(targetFarmId).isEmpty()) {
            financialTransactionRepository.save(FinancialTransaction.builder().farm(farm).transactionType("EXPENSE").category("SEED_PURCHASE").amount(new BigDecimal("3000.00")).description("Tomato Arka Rakshak Seeds & Paddy CO 51 Seeds").paymentMethod("UPI").status("COMPLETED").transactionDate(OffsetDateTime.now().minusDays(20)).build());
            financialTransactionRepository.save(FinancialTransaction.builder().farm(farm).transactionType("EXPENSE").category("FERTILIZER_PURCHASE").amount(new BigDecimal("4200.00")).description("Urea, DAP & Potash Fertilisers").paymentMethod("CASH").status("COMPLETED").transactionDate(OffsetDateTime.now().minusDays(8)).build());
            financialTransactionRepository.save(FinancialTransaction.builder().farm(farm).transactionType("EXPENSE").category("PAYROLL").amount(new BigDecimal("5500.00")).description("Field Preparation, Weeding & Staking Labour").paymentMethod("CASH").status("COMPLETED").transactionDate(OffsetDateTime.now().minusDays(12)).build());
            financialTransactionRepository.save(FinancialTransaction.builder().farm(farm).transactionType("EXPENSE").category("FUEL").amount(new BigDecimal("2200.00")).description("Electricity & Pump Maintenance for Irrigation").paymentMethod("UPI").status("COMPLETED").transactionDate(OffsetDateTime.now().minusDays(4)).build());
            financialTransactionRepository.save(FinancialTransaction.builder().farm(farm).transactionType("EXPENSE").category("OTHER").amount(new BigDecimal("1500.00")).description("Trellising Ropes & Staking Bamboo Poles").paymentMethod("CASH").status("COMPLETED").transactionDate(OffsetDateTime.now().minusDays(6)).build());
            financialTransactionRepository.save(FinancialTransaction.builder().farm(farm).transactionType("EXPENSE").category("OTHER").amount(new BigDecimal("1800.00")).description("Sprayer Servicing & Hose Repairs").paymentMethod("CASH").status("COMPLETED").transactionDate(OffsetDateTime.now().minusDays(2)).build());
            log.info("Seeded 6 demo expenses for Ramesh Uzhavan Farm");
        }

        // 8. Seed Inventory (7 items, DAP is Low Stock)
        if (inventoryItemRepository.findByFarmIdAndDeletedFalse(targetFarmId).isEmpty()) {
            inventoryItemRepository.save(InventoryItem.builder().farm(farm).name("Urea Fertilizer").nameTa("யுரியா உரம்").sku("SKU-RAMESH-UREA-01").currentQuantity(new BigDecimal("60.00")).minimumStock(new BigDecimal("20.00")).unit("kg").cost(new BigDecimal("300.00")).supplier("Coimbatore Agro Feeds").status("active").build());

            // Intentionally LOW STOCK item -> currentQuantity (4.00) < minimumStock (15.00) => Triggers Attention Item!
            inventoryItemRepository.save(InventoryItem.builder().farm(farm).name("DAP Fertilizer").nameTa("டி.ஏ.பி உரம்").sku("SKU-RAMESH-DAP-01").currentQuantity(new BigDecimal("4.00")).minimumStock(new BigDecimal("15.00")).unit("kg").cost(new BigDecimal("1350.00")).supplier("Coimbatore Agro Feeds").status("active").build());

            inventoryItemRepository.save(InventoryItem.builder().farm(farm).name("Potash Fertilizer").nameTa("பொட்டாஷ் உரம்").sku("SKU-RAMESH-POTASH-01").currentQuantity(new BigDecimal("40.00")).minimumStock(new BigDecimal("15.00")).unit("kg").cost(new BigDecimal("850.00")).supplier("Coimbatore Agro Feeds").status("active").build());
            inventoryItemRepository.save(InventoryItem.builder().farm(farm).name("Organic Manure").nameTa("இயற்கை உரம்").sku("SKU-RAMESH-MANURE-01").currentQuantity(new BigDecimal("600.00")).minimumStock(new BigDecimal("100.00")).unit("kg").cost(new BigDecimal("5.00")).supplier("Local Organic Depot").status("active").build());
            inventoryItemRepository.save(InventoryItem.builder().farm(farm).name("Paddy CO 51 Seeds").nameTa("விதை நெல் CO 51").sku("SKU-RAMESH-PADDY-SEED-01").currentQuantity(new BigDecimal("20.00")).minimumStock(new BigDecimal("10.00")).unit("kg").cost(new BigDecimal("85.00")).supplier("TNAU Seed Centre").status("active").build());
            inventoryItemRepository.save(InventoryItem.builder().farm(farm).name("Turmeric Seed Material").nameTa("மஞ்சள் விதை கிழங்கு").sku("SKU-RAMESH-TURMERIC-SEED-01").currentQuantity(new BigDecimal("50.00")).minimumStock(new BigDecimal("15.00")).unit("kg").cost(new BigDecimal("120.00")).supplier("Erode Spices Board").status("active").build());
            inventoryItemRepository.save(InventoryItem.builder().farm(farm).name("Tomato Seeds").nameTa("தக்காளி விதைகள்").sku("SKU-RAMESH-TOMATO-SEED-01").currentQuantity(new BigDecimal("5.00")).minimumStock(new BigDecimal("2.00")).unit("packets").cost(new BigDecimal("450.00")).supplier("IIHR Seed Counter").status("active").build());
            log.info("Seeded 7 inventory items for Ramesh Uzhavan Farm (including 1 low stock item DAP)");
        }

        // Summary Logs
        log.info("=== SEEDING COMPLETED FOR RAMESH KUMAR ===");
        log.info("User: ID={}, Username={}, Name={}", ramesh.getId(), ramesh.getUsername(), ramesh.getName());
        log.info("Farm: ID={}, Code={}, Name={}, Area={}", farm.getId(), farm.getFarmCode(), farm.getName(), farm.getTotalArea());
    }
}
