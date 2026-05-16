package com.slotify.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.slotify.ds.GateManager;
import com.slotify.ds.RouteGraph;
import com.slotify.ds.SlotAssigner;
import com.slotify.ds.SystemDatabase;
import com.slotify.ds.UndoAction;
import com.slotify.ds.VehicleLinkedList;
import com.slotify.model.ParkingSlot;
import com.slotify.model.Vehicle;

import jakarta.annotation.PostConstruct;

@Service
public class ParkingService {
    private final VehicleLinkedList allVehicles = new VehicleLinkedList();
    private final GateManager gate = new GateManager();
    private final SlotAssigner slotSystem = new SlotAssigner();
    private final RouteGraph map = new RouteGraph();
    private final SystemDatabase db = new SystemDatabase();

    @PostConstruct
    public void init() {
        // Add more slots for a larger lot
        slotSystem.addSlot(new ParkingSlot(101, 50));
        slotSystem.addSlot(new ParkingSlot(102, 20)); // Highest priority
        slotSystem.addSlot(new ParkingSlot(103, 80));
        slotSystem.addSlot(new ParkingSlot(104, 30));
        slotSystem.addSlot(new ParkingSlot(105, 60));

        // Expand graph nodes to better model a parking lot (nodes 0..8)
        map.addRoute(0, 1, 4);
        map.addRoute(1, 2, 6);
        map.addRoute(2, 3, 5);
        map.addRoute(3, 4, 7);
        map.addRoute(4, 5, 3);
        map.addRoute(5, 6, 4);
        map.addRoute(6, 7, 5);
        map.addRoute(7, 8, 3);

        // Connect slots to various nodes to create multiple route options
        map.addRoute(6, 101, 8);
        map.addRoute(2, 102, 9);
        map.addRoute(4, 103, 11);
        map.addRoute(5, 101, 6);
        map.addRoute(3, 102, 10);
        map.addRoute(6, 103, 7);
        map.addRoute(8, 104, 5);
        map.addRoute(1, 105, 12);
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
            gate.returnToFront(v);
            response.put("message", "Parking is full!");
            return response;
        }

        gate.recordProcessedAction(v, slot);
        // store assignment mapping
        db.assignSlot(v.plateNumber, slot);

        java.util.Map<String, Object> routeInfo = map.findShortestPathJson(0, slot.slotId);
        response.put("message", "Processed " + v.plateNumber + ". Assigned to Slot " + slot.slotId + ".");
        response.put("routePath", routeInfo.get("path"));
        response.put("routeDistance", routeInfo.get("distance"));
        response.put("assignedSlot", slot);
        return response;
    }

    public Map<String, Object> undo() {
        Map<String, Object> response = new HashMap<>();
        UndoAction action = gate.undoLastEntry();
        if (action != null) {
            if (action.assignedSlot != null) {
                slotSystem.releaseSlot(action.assignedSlot);
                db.removeAssignment(action.vehicle.plateNumber);
            }
            allVehicles.removeByPlate(action.vehicle.plateNumber);
            db.removeRecord(action.vehicle.plateNumber);
            response.put("message", "Reversed last action for: " + action.vehicle.plateNumber);
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

    public List<Vehicle> getAllReverse() {
        return allVehicles.getAllVehiclesReverse();
    }

    public String exportMapDot() {
        return map.exportAsDot();
    }

    public java.util.List<com.slotify.model.Vehicle> getAllSorted() {
        return db.getAllSorted();
    }

    public java.util.Map<String, Object> getMapJson() {
        return map.exportAsJson();
    }

    public java.util.Map<String, Object> getStats() {
        java.util.Map<String, Object> m = new java.util.HashMap<>();
        int totalParked = 0;
        for (com.slotify.model.ParkingSlot s : slotSystem.getAllSlots()) {
            if (s.isOccupied) totalParked++;
        }
        m.put("totalParked", totalParked);
        m.put("availableSlots", slotSystem.getAvailableSlotCount());
        m.put("queueSize", gate.getQueueSize());
        return m;
    }

    public java.util.List<com.slotify.model.ParkingSlot> getSlots() {
        return slotSystem.getAllSlots();
    }

    public java.util.Map<String, Object> exit(String plate) {
        java.util.Map<String, Object> resp = new java.util.HashMap<>();
        com.slotify.model.ParkingSlot slot = db.getAssignedSlot(plate);
        boolean removed = db.removeRecord(plate);
        if (removed) {
            if (slot != null) {
                slotSystem.releaseSlot(slot);
                db.removeAssignment(plate);
            }
            allVehicles.removeByPlate(plate);
            resp.put("message", "Vehicle " + plate + " removed and slot released.");
        } else {
            resp.put("message", "Plate not found: " + plate);
        }
        return resp;
    }
}