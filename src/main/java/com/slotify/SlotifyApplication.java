package com.slotify;

import java.util.List;
import java.util.Map;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import com.slotify.model.ParkingSlot;
import com.slotify.model.Vehicle;
import com.slotify.service.ParkingService;

@SpringBootApplication
public class SlotifyApplication {
    public static void main(String[] args) {
        SpringApplication.run(SlotifyApplication.class, args);
    }

    @Bean
    @SuppressWarnings("unused")
    CommandLineRunner demo(ParkingService parkingService) {
        return args -> {
            System.out.println("Slotify boot demo");
            printMap(parkingService.arriveAtGate("ABC-123", "Alice"));
            printMap(parkingService.arriveAtGate("XYZ-999", "Bob"));
            printMap(parkingService.arriveAtGate("DEF-456", "Carol"));
            printMap(parkingService.arriveAtGate("GHI-321", "Dan"));

            Map<String, Object> processed1 = parkingService.processNext();
            printMap(processed1);
            Map<String, Object> processed2 = parkingService.processNext();
            printMap(processed2);

            List<Vehicle> vehicles = parkingService.getAll();
            System.out.println("All vehicles (in insertion order): " + vehicles.stream()
                .map(vehicle -> vehicle.plateNumber + "(" + vehicle.ownerName + ")")
                .toList());

            // Show reverse insertion order (most recent first)
            System.out.println("All vehicles (reverse insertion): " + parkingService.getAll().stream()
                .map(v -> v.plateNumber).toList());

            Vehicle found = parkingService.search("ABC-123");
            System.out.println(found == null
                ? "Search result: not found"
                : "Search result: " + found.plateNumber + " owned by " + found.ownerName);

            // Demonstrate undo
            Map<String, Object> undoResp = parkingService.undo();
            System.out.println(undoResp.get("message"));

            // Print sorted list from BST
            List<Vehicle> sorted = parkingService.getAllSorted();
            System.out.println("All vehicles (sorted by plate): " + sorted.stream()
                .map(v -> v.plateNumber).toList());

            // Print Graphviz DOT for the map
            System.out.println("--- RouteGraph DOT ---");
            System.out.println(parkingService.exportMapDot());
        };
    }

    private void printMap(Map<String, Object> response) {
        if (response.containsKey("assignedSlot") && response.get("assignedSlot") instanceof ParkingSlot) {
            ParkingSlot slot = (ParkingSlot) response.get("assignedSlot");
            System.out.println("{message=" + response.get("message") + ", assignedSlot=ParkingSlot{slotId="
                    + slot.slotId + ", distance=" + slot.distance + ", isOccupied=" + slot.isOccupied + "}}");
            return;
        }

        System.out.println(response);
    }
}