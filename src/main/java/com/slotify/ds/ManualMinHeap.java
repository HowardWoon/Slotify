package com.slotify.ds;

import java.util.ArrayList;
import java.util.List;

import com.slotify.model.ParkingSlot;

public class ManualMinHeap {
    private final List<ParkingSlot> heap = new ArrayList<>();

    public void insert(ParkingSlot slot) {
        heap.add(slot);
        heapifyUp(heap.size() - 1);
    }

    public ParkingSlot extractMin() {
        if (heap.isEmpty()) {
            return null;
        }

        ParkingSlot min = heap.get(0);
        ParkingSlot last = heap.remove(heap.size() - 1);

        if (!heap.isEmpty()) {
            heap.set(0, last);
            heapifyDown(0);
        }

        return min;
    }

    public boolean isEmpty() {
        return heap.isEmpty();
    }

    public int size() {
        return heap.size();
    }

    private void heapifyUp(int index) {
        while (index > 0) {
            int parentIndex = (index - 1) / 2;
            if (heap.get(index).compareTo(heap.get(parentIndex)) >= 0) {
                break;
            }
            swap(index, parentIndex);
            index = parentIndex;
        }
    }

    private void heapifyDown(int index) {
        while (true) {
            int leftIndex = index * 2 + 1;
            int rightIndex = index * 2 + 2;
            int smallestIndex = index;

            if (leftIndex < heap.size() && heap.get(leftIndex).compareTo(heap.get(smallestIndex)) < 0) {
                smallestIndex = leftIndex;
            }

            if (rightIndex < heap.size() && heap.get(rightIndex).compareTo(heap.get(smallestIndex)) < 0) {
                smallestIndex = rightIndex;
            }

            if (smallestIndex == index) {
                return;
            }

            swap(index, smallestIndex);
            index = smallestIndex;
        }
    }

    private void swap(int firstIndex, int secondIndex) {
        ParkingSlot temp = heap.get(firstIndex);
        heap.set(firstIndex, heap.get(secondIndex));
        heap.set(secondIndex, temp);
    }
}