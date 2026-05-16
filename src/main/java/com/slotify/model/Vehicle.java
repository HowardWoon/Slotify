package com.slotify.model;

public class Vehicle {
    public String plateNumber;
    public String ownerName;

    public Vehicle(String plateNumber, String ownerName) {
        this.plateNumber = plateNumber;
        this.ownerName = ownerName;
    }

    @Override
    public String toString() {
        return "Vehicle{plateNumber='" + plateNumber + "', ownerName='" + ownerName + "'}";
    }
}