package com.slotify.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.slotify.model.Vehicle;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class ParkingServiceTest {

    @Autowired
    ParkingService parkingService;

    @Test
    void arriveProcessUndoExitFlow() {
        String plate = "TST-111";
        Map<String, Object> statsBefore = parkingService.getStats();
        int beforeQueue = (int) statsBefore.getOrDefault("queueSize", 0);

        Map<String, Object> arrived = parkingService.arriveAtGate(plate, "Tester");
        int afterQueue = (int) arrived.getOrDefault("queueSize", -1);
        assertThat(afterQueue).isEqualTo(beforeQueue + 1);

        // process until our plate is processed (demo data may be present)
        Map<String, Object> processed = null;
        boolean found = false;
        for (int i = 0; i < 10; i++) {
            processed = parkingService.processNext();
            if (processed != null && processed.get("message") != null
                    && processed.get("message").toString().contains(plate)) {
                found = true;
                break;
            }
        }
        assertThat(found).isTrue();
        assertThat(processed).containsKey("assignedSlot");

        Map<String, Object> status = parkingService.searchVehicleStatus(plate);
        assertThat(status).containsEntry("found", true);
        assertThat(status.get("status")).isEqualTo("Parked");

        Map<String, Object> exit = parkingService.exit(plate);
        assertThat(exit.get("message")).asString().contains("removed");

        Map<String, Object> statusAfter = parkingService.searchVehicleStatus(plate);
        assertThat(statusAfter).containsEntry("found", false);
    }

    @Test
    void multipleVehiclesAndStats() {
        parkingService.arriveAtGate("M1-001", "A");
        parkingService.arriveAtGate("M2-002", "B");
        parkingService.arriveAtGate("M3-003", "C");

        List<Vehicle> all = parkingService.getAll();
        assertThat(all.size()).isGreaterThanOrEqualTo(3);

        Map<String, Object> stats = parkingService.getStats();
        assertThat(stats).containsKeys("availableSlots", "queueSize", "totalRecorded");
    }

    @Test
    void exportMapDotAndJson() {
        String dot = parkingService.exportMapDot();
        assertThat(dot).contains("graph RouteGraph");

        Map<String, Object> json = parkingService.getMapJson();
        assertThat(json).containsKeys("nodes", "edges");
    }
}
