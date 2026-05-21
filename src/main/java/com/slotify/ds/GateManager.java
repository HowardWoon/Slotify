package com.slotify.ds;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;
import java.util.Stack;

import com.slotify.model.ParkingSlot;
import com.slotify.model.Vehicle;

public class GateManager {
    private Queue<Vehicle> entranceQueue = new LinkedList<>();
    private final Stack<UndoAction> undoStack = new Stack<>();

    public void arriveAtGate(Vehicle v) {
        entranceQueue.add(v);
    }

    public void returnToFront(Vehicle v) {
        if (entranceQueue instanceof LinkedList) {
            LinkedList<Vehicle> linkedList = (LinkedList<Vehicle>) entranceQueue;
            linkedList.addFirst(v);
        } else {
            LinkedList<Vehicle> rebuiltQueue = new LinkedList<>();
            rebuiltQueue.add(v);
            rebuiltQueue.addAll(entranceQueue);
            entranceQueue = rebuiltQueue;
        }
    }

    public Vehicle processNextVehicle() {
        if (entranceQueue.isEmpty()) return null;
        return entranceQueue.poll();
    }

    public void recordProcessedAction(Vehicle vehicle, ParkingSlot slot) {
        undoStack.push(new UndoAction(vehicle, slot));
    }

    public UndoAction undoLastEntry() {
        if (undoStack.isEmpty()) return null;
        return undoStack.pop();
    }
    
    public int getQueueSize() {
        return entranceQueue.size();
    }

    public List<Vehicle> getQueueDetails() {
        return new ArrayList<>(entranceQueue);
    }
}
