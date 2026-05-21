package com.slotify.controller;

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

    @GetMapping("/all")
    public List<Vehicle> getAll() {
        return parkingService.getAllReverse();
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
}
