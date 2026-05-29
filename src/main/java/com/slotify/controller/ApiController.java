package com.slotify.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.slotify.model.Vehicle;
import com.slotify.service.ParkingService;

@RestController
@RequestMapping("/api")
public class ApiController {

    @Autowired
    private ParkingService parkingService;

    @PostMapping("/arrive")
    public Map<String, Object> arrive(@RequestParam("plate") String plate, @RequestParam("name") String name) {
        return parkingService.arriveAtGate(plate, name);
    }

    @PostMapping("/process")
    public Map<String, Object> process() {
        return parkingService.processNext();
    }

    @PostMapping("/undo")
    public Map<String, Object> undo() {
        return parkingService.undo();
    }

    @GetMapping("/search")
    public Map<String, Object> search(@RequestParam("plate") String plate) {
        return parkingService.searchVehicleStatus(plate);
    }

    private List<Map<String, Object>> enrichVehicles(List<Vehicle> vehicles) {
        List<Map<String, Object>> enriched = new ArrayList<>();
        for (Vehicle v : vehicles) {
            Map<String, Object> m = new HashMap<>();
            m.put("plateNumber", v.plateNumber);
            m.put("ownerName", v.ownerName);
            Map<String, Object> search = parkingService.searchVehicleStatus(v.plateNumber);
            if (Boolean.TRUE.equals(search.get("found")) && search.get("slotId") != null) {
                m.put("slotId", search.get("slotId"));
            }
            enriched.add(m);
        }
        return enriched;
    }

    @GetMapping("/all")
    public List<Map<String, Object>> getAll() {
        return enrichVehicles(parkingService.getAllReverse());
    }

    @GetMapping("/sorted")
    public List<Map<String, Object>> getSorted() {
        return enrichVehicles(parkingService.getAllSorted());
    }

    @GetMapping("/map")
    public java.util.Map<String, Object> getMap() {
        return parkingService.getMapJson();
    }

    @GetMapping("/stats")
    public java.util.Map<String, Object> getStats() {
        return parkingService.getStats();
    }

    @GetMapping("/slots")
    public java.util.List<com.slotify.model.ParkingSlot> getSlots() {
        return parkingService.getSlots();
    }

    @GetMapping("/mapdot")
    public String getMapDot() {
        return parkingService.exportMapDot();
    }

    @PostMapping("/exit")
    public Map<String, Object> exit(@RequestParam("plate") String plate) {
        return parkingService.exit(plate);
    }

    @GetMapping("/route")
    public Map<String, Object> getRoute(@RequestParam("start") int start, @RequestParam("end") int end) {
        return parkingService.getShortestPath(start, end);
    }
}
