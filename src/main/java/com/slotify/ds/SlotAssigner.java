package com.slotify.ds;
import com.slotify.model.ParkingSlot;

public class SlotAssigner {
    private final ManualMinHeap availableSlots = new ManualMinHeap();
    private final java.util.List<com.slotify.model.ParkingSlot> allSlots = new java.util.ArrayList<>();
    private RouteGraph routeGraph;

    public void setRouteGraph(RouteGraph graph) {
        this.routeGraph = graph;
        updateSlotDistances();
    }

    public void updateSlotDistances() {
        if (routeGraph != null) {
            java.util.List<ParkingSlot> tempSlots = availableSlots.getAllSlots();
            for (ParkingSlot slot : tempSlots) {
                if (!slot.isOccupied) {
                    java.util.Map<String, Object> pathInfo = routeGraph.findShortestPathJson(0, slot.slotId);
                    int distance = (Integer) pathInfo.get("distance");
                    if (distance != -1) {
                        slot.distance = distance;
                    } else {
                        slot.distance = Integer.MAX_VALUE;
                    }
                }
            }
            availableSlots.rebuildHeap();
        }
    }

    public void addSlot(ParkingSlot slot) {
        availableSlots.insert(slot);
        allSlots.add(slot);
    }

    public ParkingSlot assignBestSlot() {
        if (availableSlots.isEmpty()) return null;
        
        ParkingSlot bestSlot = availableSlots.extractMin();
        if (bestSlot != null) {
            bestSlot.isOccupied = true;
        }
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