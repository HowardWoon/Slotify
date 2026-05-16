package com.slotify.ds;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;

public class RouteGraph {
    private Map<Integer, List<Edge>> adjList = new HashMap<>();

    class Edge {
        int targetNode;
        int weight;
        public Edge(int targetNode, int weight) {
            this.targetNode = targetNode;
            this.weight = weight;
        }
    }

    public void addRoute(int source, int destination, int distance) {
        adjList.putIfAbsent(source, new ArrayList<>());
        adjList.get(source).add(new Edge(destination, distance));
        adjList.putIfAbsent(destination, new ArrayList<>());
        adjList.get(destination).add(new Edge(source, distance));
    }

    public String findShortestPath(int startNode, int endNode) {
        PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[1]));
        Map<Integer, Integer> distances = new HashMap<>();
        
        for (Integer node : adjList.keySet()) distances.put(node, Integer.MAX_VALUE);
        distances.put(startNode, 0);
        pq.add(new int[]{startNode, 0});

        while (!pq.isEmpty()) {
            int[] current = pq.poll();
            int currNode = current[0];
            int currDist = current[1];

            if (currNode == endNode) {
                return "Shortest route from Entrance to Slot " + endNode + " is " + currDist + "m.";
            }

            if (adjList.containsKey(currNode)) {
                for (Edge neighbor : adjList.get(currNode)) {
                    int newDist = currDist + neighbor.weight;
                    if (newDist < distances.get(neighbor.targetNode)) {
                        distances.put(neighbor.targetNode, newDist);
                        pq.add(new int[]{neighbor.targetNode, newDist});
                    }
                }
            }
        }
        return "No valid route found.";
    }
}