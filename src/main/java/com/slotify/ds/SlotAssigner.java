package com.slotify.ds;
import com.slotify.model.ParkingSlot;
import java.util.PriorityQueue;

public class SlotAssigner {
    private PriorityQueue<ParkingSlot> availableSlots = new PriorityQueue<>();

    public void addSlot(ParkingSlot slot) {
        availableSlots.add(slot);
    }

    public ParkingSlot assignBestSlot() {
        if (availableSlots.isEmpty()) return null;
        ParkingSlot bestSlot = availableSlots.poll();
        bestSlot.isOccupied = true;
        return bestSlot;
    }

    public void releaseSlot(ParkingSlot slot) {
        slot.isOccupied = false;
        availableSlots.add(slot);
    }
}