package com.slotify.ds;
import java.util.LinkedList;
import java.util.Queue;
import java.util.Stack;

import com.slotify.model.Vehicle;

public class GateManager {
    private Queue<Vehicle> entranceQueue = new LinkedList<>();
    private Stack<Vehicle> undoStack = new Stack<>();

    public void arriveAtGate(Vehicle v) {
        entranceQueue.add(v);
    }

    public Vehicle processNextVehicle() {
        if (entranceQueue.isEmpty()) return null;
        Vehicle processed = entranceQueue.poll();
        undoStack.push(processed);
        return processed;
    }

    public Vehicle undoLastEntry() {
        if (undoStack.isEmpty()) return null;
        return undoStack.pop();
    }
    
    public int getQueueSize() {
        return entranceQueue.size();
    }
}