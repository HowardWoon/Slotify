package com.slotify.model;

public class ParkingSlot implements Comparable<ParkingSlot> {
    public int slotId;
    public int distance;
    public boolean isOccupied;

    public ParkingSlot(int slotId, int distance) {
        this.slotId = slotId;
        this.distance = distance;
        this.isOccupied = false;
    }

    @Override
    public int compareTo(ParkingSlot other) {
        return Integer.compare(this.distance, other.distance);
    }

    @Override
    public String toString() {
        return "ParkingSlot{slotId=" + slotId + ", distance=" + distance + ", isOccupied=" + isOccupied + "}";
    }
}