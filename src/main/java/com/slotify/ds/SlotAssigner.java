package com.slotify.ds;
import com.slotify.model.ParkingSlot;

public class SlotAssigner {
    private final ManualMinHeap availableSlots = new ManualMinHeap();
    private final java.util.List<com.slotify.model.ParkingSlot> allSlots = new java.util.ArrayList<>();

    public void addSlot(ParkingSlot slot) {
        availableSlots.insert(slot);
        allSlots.add(slot);
    }

    public ParkingSlot assignBestSlot() {
        if (availableSlots.isEmpty()) return null;
        ParkingSlot bestSlot = availableSlots.extractMin();
        bestSlot.isOccupied = true;
        return bestSlot;
    }

    public void releaseSlot(ParkingSlot slot) {
        slot.isOccupied = false;
        availableSlots.insert(slot);
    }

    public int getAvailableSlotCount() {
        return availableSlots.size();
    }

    public java.util.List<ParkingSlot> getAllSlots() {
        return java.util.Collections.unmodifiableList(allSlots);
    }
}