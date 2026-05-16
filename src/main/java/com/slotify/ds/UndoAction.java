package com.slotify.ds;

import com.slotify.model.ParkingSlot;
import com.slotify.model.Vehicle;

public class UndoAction {
    public final Vehicle vehicle;
    public final ParkingSlot assignedSlot;
    public final long timestamp;

    public UndoAction(Vehicle vehicle, ParkingSlot assignedSlot) {
        this.vehicle = vehicle;
        this.assignedSlot = assignedSlot;
        this.timestamp = System.currentTimeMillis();
    }
}