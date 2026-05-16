package com.slotify.controller;

import com.slotify.model.Vehicle;
import com.slotify.service.ParkingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ApiController {

    @Autowired
    private ParkingService parkingService;

    @PostMapping("/arrive")
    public Map<String, Object> arrive(@RequestParam String plate, @RequestParam String name) {
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
    public Vehicle search(@RequestParam String plate) {
        return parkingService.search(plate);
    }

    @GetMapping("/all")
    public List<Vehicle> getAll() {
        return parkingService.getAll();
    }
}