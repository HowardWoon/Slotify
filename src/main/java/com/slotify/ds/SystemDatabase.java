package com.slotify.ds;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.slotify.model.ParkingSlot;
import com.slotify.model.Vehicle;

public class SystemDatabase {
    private final HashMap<String, Vehicle> fastCache = new HashMap<>();
    private final Map<String, ParkingSlot> slotAssignments = new HashMap<>();
    
    class BSTNode {
        Vehicle vehicle;
        BSTNode left, right;
        int height = 1;

        public BSTNode(Vehicle v) { this.vehicle = v; }
    }
    
    private BSTNode bstRoot;

    public void insertRecord(Vehicle v) {
        fastCache.put(v.plateNumber, v);
        bstRoot = insertRecursive(bstRoot, v);
    }

    public void assignSlot(String plate, ParkingSlot slot) {
        if (plate == null || slot == null) return;
        slotAssignments.put(plate, slot);
    }

    public ParkingSlot getAssignedSlot(String plate) {
        return slotAssignments.get(plate);
    }

    public void removeAssignment(String plate) {
        slotAssignments.remove(plate);
    }

    public Map<Integer, String> getOccupiedSlotPlates() {
        Map<Integer, String> occupiedSlotPlates = new HashMap<>();
        for (Map.Entry<String, ParkingSlot> entry : slotAssignments.entrySet()) {
            occupiedSlotPlates.put(entry.getValue().slotId, entry.getKey());
        }
        return occupiedSlotPlates;
    }

    public boolean removeRecord(String plate) {
        Vehicle removed = fastCache.remove(plate);
        if (removed == null) {
            return false;
        }

        bstRoot = deleteRecursive(bstRoot, plate);
        return true;
    }

    private BSTNode insertRecursive(BSTNode root, Vehicle v) {
        if (root == null) return new BSTNode(v);

        if (v.plateNumber.compareTo(root.vehicle.plateNumber) < 0)
            root.left = insertRecursive(root.left, v);
        else if (v.plateNumber.compareTo(root.vehicle.plateNumber) > 0)
            root.right = insertRecursive(root.right, v);
        else {
            root.vehicle = v;
            return root;
        }

        root.height = 1 + Math.max(getHeight(root.left), getHeight(root.right));

        int balance = getBalance(root);

        if (balance > 1 && v.plateNumber.compareTo(root.left.vehicle.plateNumber) < 0) {
            return rotateRight(root);
        }

        if (balance < -1 && v.plateNumber.compareTo(root.right.vehicle.plateNumber) > 0) {
            return rotateLeft(root);
        }

        if (balance > 1 && v.plateNumber.compareTo(root.left.vehicle.plateNumber) > 0) {
            root.left = rotateLeft(root.left);
            return rotateRight(root);
        }

        if (balance < -1 && v.plateNumber.compareTo(root.right.vehicle.plateNumber) < 0) {
            root.right = rotateRight(root.right);
            return rotateLeft(root);
        }

        return root;
    }

    public Vehicle fastRetrieve(String plate) {
        return fastCache.get(plate);
    }

    public Vehicle searchBST(String plate) {
        return searchRecursive(bstRoot, plate);
    }

    public List<Vehicle> getAllSorted() {
        List<Vehicle> vehicles = new ArrayList<>();
        inOrderTraversal(bstRoot, vehicles);
        return vehicles;
    }

    private Vehicle searchRecursive(BSTNode root, String plate) {
        if (root == null) return null;
        if (root.vehicle.plateNumber.equals(plate)) return root.vehicle;
        if (plate.compareTo(root.vehicle.plateNumber) < 0) return searchRecursive(root.left, plate);
        return searchRecursive(root.right, plate);
    }

    private BSTNode deleteRecursive(BSTNode root, String plate) {
        if (root == null) {
            return null;
        }

        int compare = plate.compareTo(root.vehicle.plateNumber);
        if (compare < 0) {
            root.left = deleteRecursive(root.left, plate);
        } else if (compare > 0) {
            root.right = deleteRecursive(root.right, plate);
        } else {
            if (root.left == null || root.right == null) {
                BSTNode replacement = (root.left != null) ? root.left : root.right;
                if (replacement == null) {
                    return null;
                }
                root = replacement;
            } else {
                BSTNode successor = getMinValueNode(root.right);
                root.vehicle = successor.vehicle;
                root.right = deleteRecursive(root.right, successor.vehicle.plateNumber);
            }
        }

        root.height = 1 + Math.max(getHeight(root.left), getHeight(root.right));
        int balance = getBalance(root);

        if (balance > 1 && getBalance(root.left) >= 0) {
            return rotateRight(root);
        }

        if (balance > 1 && getBalance(root.left) < 0) {
            root.left = rotateLeft(root.left);
            return rotateRight(root);
        }

        if (balance < -1 && getBalance(root.right) <= 0) {
            return rotateLeft(root);
        }

        if (balance < -1 && getBalance(root.right) > 0) {
            root.right = rotateRight(root.right);
            return rotateLeft(root);
        }

        return root;
    }

    private void inOrderTraversal(BSTNode root, List<Vehicle> vehicles) {
        if (root == null) {
            return;
        }

        inOrderTraversal(root.left, vehicles);
        vehicles.add(root.vehicle);
        inOrderTraversal(root.right, vehicles);
    }

    private BSTNode getMinValueNode(BSTNode root) {
        BSTNode current = root;
        while (current.left != null) {
            current = current.left;
        }
        return current;
    }

    private int getHeight(BSTNode node) {
        return node == null ? 0 : node.height;
    }

    private int getBalance(BSTNode node) {
        return node == null ? 0 : getHeight(node.left) - getHeight(node.right);
    }

    private BSTNode rotateRight(BSTNode y) {
        BSTNode x = y.left;
        BSTNode t2 = x.right;

        x.right = y;
        y.left = t2;

        y.height = 1 + Math.max(getHeight(y.left), getHeight(y.right));
        x.height = 1 + Math.max(getHeight(x.left), getHeight(x.right));

        return x;
    }

    private BSTNode rotateLeft(BSTNode x) {
        BSTNode y = x.right;
        BSTNode t2 = y.left;

        y.left = x;
        x.right = t2;

        x.height = 1 + Math.max(getHeight(x.left), getHeight(x.right));
        y.height = 1 + Math.max(getHeight(y.left), getHeight(y.right));

        return y;
    }
}
