package com.slotify.service;

import com.slotify.ds.*;
import com.slotify.model.*;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ParkingService {
    private VehicleLinkedList allVehicles = new VehicleLinkedList();
    private GateManager gate = new GateManager();
    private SlotAssigner slotSystem = new SlotAssigner();
    private RouteGraph map = new RouteGraph();
    private SystemDatabase db = new SystemDatabase();

    @PostConstruct
    public void init() {
        slotSystem.addSlot(new ParkingSlot(101, 50));
        slotSystem.addSlot(new ParkingSlot(102, 20)); // Highest priority
        slotSystem.addSlot(new ParkingSlot(103, 80));
        
        map.addRoute(0, 102, 20);
        map.addRoute(0, 101, 50);
        map.addRoute(102, 103, 60);
    }

    public Map<String, Object> arriveAtGate(String plate, String name) {
        Vehicle v = new Vehicle(plate, name);
        gate.arriveAtGate(v);
        allVehicles.addVehicle(v);
        db.insertRecord(v);
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Vehicle " + plate + " added to queue.");
        response.put("queueSize", gate.getQueueSize());
        return response;
    }

    public Map<String, Object> processNext() {
        Map<String, Object> response = new HashMap<>();
        Vehicle v = gate.processNextVehicle();
        if (v == null) {
            response.put("message", "Queue is empty.");
            return response;
        }

        ParkingSlot slot = slotSystem.assignBestSlot();
        if (slot == null) {
            response.put("message", "Parking is full!");
            return response;
        }

        String route = map.findShortestPath(0, slot.slotId);
        response.put("message", "Processed " + v.plateNumber + ". Assigned to Slot " + slot.slotId + ". " + route);
        return response;
    }

    public Map<String, Object> undo() {
        Map<String, Object> response = new HashMap<>();
        Vehicle v = gate.undoLastEntry();
        if (v != null) {
            response.put("message", "Undid entry for: " + v.plateNumber);
        } else {
            response.put("message", "Nothing to undo.");
        }
        return response;
    }

    public Vehicle search(String plate) {
        return db.searchBST(plate);
    }

    public List<Vehicle> getAll() {
        return allVehicles.getAllVehicles();
    }
}