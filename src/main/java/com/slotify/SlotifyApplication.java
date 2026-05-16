package com.slotify;

import com.slotify.service.ParkingService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class SlotifyApplication {
    public static void main(String[] args) {
        SpringApplication.run(SlotifyApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(ParkingService parkingService) {
        return args -> {
            System.out.println("Slotify boot demo");
            System.out.println(parkingService.arriveAtGate("ABC-123", "Alice"));
            System.out.println(parkingService.arriveAtGate("XYZ-999", "Bob"));
            System.out.println(parkingService.processNext());
            System.out.println(parkingService.getAll());
            System.out.println(parkingService.search("ABC-123"));
        };
    }
}