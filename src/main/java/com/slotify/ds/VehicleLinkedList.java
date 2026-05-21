package com.slotify.ds;
import java.util.ArrayList;
import java.util.List;

import com.slotify.model.Vehicle;

public class VehicleLinkedList {
    class Node {
        Vehicle vehicle;
        Node prev;
        Node next;
        public Node(Vehicle v) { this.vehicle = v; }
    }

    private Node head;
    private Node tail;

    public void addVehicle(Vehicle v) {//addLast
        Node newNode = new Node(v);
        if (head == null) {
            head = newNode;
            tail = newNode;
        } else {
            tail.next = newNode;
            newNode.prev = tail;
            tail = newNode;
        }
    }

    public boolean removeByPlate(String plate) {
        Node current=head;
        while(current!=null){
            if(current.vehicle!=null && current.vehicle.plateNumber.equals(plate)){
                if(current.prev==null){
                    head=current.next;
                    if(head!=null){
                        head.prev=null;
                    }else{
                        tail=null;
                    }

                }else if(current.next==null){
                    tail=current.prev;
                    tail.next=null;
                }else{
                    current.prev.next=current.next;
                    current.next.prev=current.prev;
                }
                current.prev=null;
                current.next=null;
                return true;
            }
            current=current.next;
        }
        return false;
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

    public List<Vehicle> getAllVehiclesReverse() {
        List<Vehicle> list = new ArrayList<>();
        Node temp = tail;
        while (temp != null) {
            list.add(temp.vehicle);
            temp = temp.prev;
        }
        return list;
    }
}