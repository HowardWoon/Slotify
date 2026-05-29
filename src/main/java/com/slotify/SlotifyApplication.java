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
        int port = 8081;
        if (!isPortAvailable(port)) {
            int altPort = 8082;
            while (altPort < 9000) {
                if (isPortAvailable(altPort)) {
                    port = altPort;
                    break;
                }
                altPort++;
            }
        }
        System.setProperty("server.port", String.valueOf(port));
        SpringApplication.run(SlotifyApplication.class, args);
        System.out.println("Slotify Application started successfully. Access the dashboard at: http://localhost:" + port);
    }

    private static boolean isPortAvailable(int port) {
        try (java.net.ServerSocket serverSocket = new java.net.ServerSocket(port)) {
            return true;
        } catch (java.io.IOException e) {
            return false;
        }
    }

    @Bean
    @SuppressWarnings("unused")
    CommandLineRunner demo(ParkingService parkingService, org.springframework.core.env.Environment env) {
        return args -> {
            String port = env.getProperty("local.server.port");
            if (port == null) {
                port = System.getProperty("server.port", "8081");
            }
            System.out.println("Slotify boot demo");
            System.out.println("Interactive Dashboard URL: http://localhost:" + port);
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

            Map<String, Object> searchResult = parkingService.searchVehicleStatus("ABC-123");
            Vehicle found = (Vehicle) searchResult.get("vehicle");
            System.out.println(Boolean.TRUE.equals(searchResult.get("found"))
                && found != null
                ? "Search result: " + found.plateNumber + " owned by " + found.ownerName
                : "Search result: not found");

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
