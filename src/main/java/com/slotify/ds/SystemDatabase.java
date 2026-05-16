package com.slotify.ds;
import com.slotify.model.Vehicle;
import java.util.HashMap;

public class SystemDatabase {
    private HashMap<String, Vehicle> fastCache = new HashMap<>();
    
    class BSTNode {
        Vehicle vehicle;
        BSTNode left, right;
        public BSTNode(Vehicle v) { this.vehicle = v; }
    }
    
    private BSTNode bstRoot;

    public void insertRecord(Vehicle v) {
        fastCache.put(v.plateNumber, v);
        bstRoot = insertRecursive(bstRoot, v);
    }

    private BSTNode insertRecursive(BSTNode root, Vehicle v) {
        if (root == null) return new BSTNode(v);
        if (v.plateNumber.compareTo(root.vehicle.plateNumber) < 0)
            root.left = insertRecursive(root.left, v);
        else if (v.plateNumber.compareTo(root.vehicle.plateNumber) > 0)
            root.right = insertRecursive(root.right, v);
        return root;
    }

    public Vehicle fastRetrieve(String plate) {
        return fastCache.get(plate);
    }

    public Vehicle searchBST(String plate) {
        return searchRecursive(bstRoot, plate);
    }

    private Vehicle searchRecursive(BSTNode root, String plate) {
        if (root == null) return null;
        if (root.vehicle.plateNumber.equals(plate)) return root.vehicle;
        if (plate.compareTo(root.vehicle.plateNumber) < 0) return searchRecursive(root.left, plate);
        return searchRecursive(root.right, plate);
    }
}