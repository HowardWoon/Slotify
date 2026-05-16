package com.slotify.ds;
import java.util.ArrayList;
import java.util.List;

import com.slotify.model.Vehicle;

public class VehicleLinkedList {
    class Node {
        Vehicle vehicle;
        Node next;
        public Node(Vehicle v) { this.vehicle = v; }
    }

    private Node head;

    public void addVehicle(Vehicle v) {
        Node newNode = new Node(v);
        if (head == null) {
            head = newNode;
        } else {
            Node temp = head;
            while (temp.next != null) {
                temp = temp.next;
            }
            temp.next = newNode;
        }
    }

    public List<Vehicle> getAllVehicles() {
        List<Vehicle> list = new ArrayList<>();
        Node temp = head;
        while (temp != null) {
            list.add(temp.vehicle);
            temp = temp.next;
        }
        return list;
    }
}