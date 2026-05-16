package com.slotify.ds;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;

public class RouteGraph {
    private final Map<Integer, List<Edge>> adjList = new HashMap<>();

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
        Map<Integer, Integer> previous = new HashMap<>();
        
        for (Integer node : adjList.keySet()) {
            distances.put(node, Integer.MAX_VALUE);
        }
        distances.put(startNode, 0);
        pq.add(new int[]{startNode, 0});

        while (!pq.isEmpty()) {
            int[] current = pq.poll();
            int currNode = current[0];
            int currDist = current[1];

            if (currDist > distances.getOrDefault(currNode, Integer.MAX_VALUE)) {
                continue;
            }

            if (currNode == endNode) {
                return buildRouteMessage(startNode, endNode, previous, currDist);
            }

            if (adjList.containsKey(currNode)) {
                for (Edge neighbor : adjList.get(currNode)) {
                    int newDist = currDist + neighbor.weight;
                    if (newDist < distances.getOrDefault(neighbor.targetNode, Integer.MAX_VALUE)) {
                        distances.put(neighbor.targetNode, newDist);
                        previous.put(neighbor.targetNode, currNode);
                        pq.add(new int[]{neighbor.targetNode, newDist});
                    }
                }
            }
        }
        return "No valid route found.";
    }

    public java.util.Map<String, Object> findShortestPathJson(int startNode, int endNode) {
        java.util.PriorityQueue<int[]> pq = new java.util.PriorityQueue<>(java.util.Comparator.comparingInt(a -> a[1]));
        java.util.Map<Integer, Integer> distances = new java.util.HashMap<>();
        java.util.Map<Integer, Integer> previous = new java.util.HashMap<>();
        java.util.Set<Integer> nodes = adjList.keySet();

        for (Integer node : nodes) {
            distances.put(node, Integer.MAX_VALUE);
        }
        distances.put(startNode, 0);
        pq.add(new int[]{startNode, 0});

        while (!pq.isEmpty()) {
            int[] current = pq.poll();
            int currNode = current[0];
            int currDist = current[1];

            if (currDist > distances.getOrDefault(currNode, Integer.MAX_VALUE)) {
                continue;
            }

            if (currNode == endNode) {
                // build path
                java.util.List<Integer> path = new java.util.ArrayList<>();
                Integer cur = endNode;
                while (cur != null) {
                    path.add(0, cur);
                    if (cur == startNode) break;
                    cur = previous.get(cur);
                }
                java.util.Map<String, Object> out = new java.util.HashMap<>();
                out.put("path", path);
                out.put("distance", currDist);
                return out;
            }

            if (adjList.containsKey(currNode)) {
                for (Edge neighbor : adjList.get(currNode)) {
                    int newDist = currDist + neighbor.weight;
                    if (newDist < distances.getOrDefault(neighbor.targetNode, Integer.MAX_VALUE)) {
                        distances.put(neighbor.targetNode, newDist);
                        previous.put(neighbor.targetNode, currNode);
                        pq.add(new int[]{neighbor.targetNode, newDist});
                    }
                }
            }
        }

        java.util.Map<String, Object> fail = new java.util.HashMap<>();
        fail.put("path", java.util.Collections.emptyList());
        fail.put("distance", -1);
        return fail;
    }

    private String buildRouteMessage(int startNode, int endNode, Map<Integer, Integer> previous, int totalDistance) {
        List<Integer> path = new ArrayList<>();
        Integer current = endNode;

        while (current != null) {
            path.add(0, current);
            if (current == startNode) {
                break;
            }
            current = previous.get(current);
        }

        if (path.isEmpty() || path.get(0) != startNode) {
            return "No valid route found.";
        }

        StringBuilder builder = new StringBuilder("Route: ");
        for (int i = 0; i < path.size(); i++) {
            builder.append(formatNode(path.get(i)));
            if (i < path.size() - 1) {
                builder.append(" -> ");
            }
        }
        builder.append(" | Total distance: ").append(totalDistance).append("m.");
        return builder.toString();
    }

    private String formatNode(int nodeId) {
        if (nodeId == 0) {
            return "Entrance";
        }
        if (nodeId >= 100) {
            return "Slot " + nodeId;
        }
        return "Node " + nodeId;
    }

    // Export the adjacency list as a Graphviz DOT string for visualization.
    public String exportAsDot() {
        StringBuilder sb = new StringBuilder();
        sb.append("graph RouteGraph {\n");
        sb.append("  node [shape=circle];\n");

        for (Map.Entry<Integer, List<Edge>> entry : adjList.entrySet()) {
            int src = entry.getKey();
            for (Edge e : entry.getValue()) {
                // To avoid duplicate undirected edges, only print when src <= target
                if (src <= e.targetNode) {
                    String a = labelForDot(src);
                    String b = labelForDot(e.targetNode);
                    sb.append("  ").append(a).append(" -- ").append(b).append(" [label=\"")
                      .append(e.weight).append("\"];\n");
                }
            }
        }

        sb.append("}\n");
        return sb.toString();
    }

    private String labelForDot(int nodeId) {
        if (nodeId == 0) return "Entrance";
        if (nodeId >= 100) return "Slot" + nodeId;
        return "N" + nodeId;
    }

    public java.util.Map<String, Object> exportAsJson() {
        java.util.Set<Integer> nodes = new java.util.HashSet<>();
        java.util.List<java.util.Map<String, Object>> edges = new java.util.ArrayList<>();
        java.util.Set<String> seen = new java.util.HashSet<>();

        for (java.util.Map.Entry<Integer, List<Edge>> entry : adjList.entrySet()) {
            int src = entry.getKey();
            nodes.add(src);
            for (Edge e : entry.getValue()) {
                nodes.add(e.targetNode);
                int a = Math.min(src, e.targetNode);
                int b = Math.max(src, e.targetNode);
                String key = a + "-" + b + "-" + e.weight;
                if (seen.contains(key)) continue;
                seen.add(key);
                java.util.Map<String, Object> edge = new java.util.HashMap<>();
                edge.put("source", src);
                edge.put("target", e.targetNode);
                edge.put("weight", e.weight);
                edges.add(edge);
            }
        }

        java.util.List<java.util.Map<String, Object>> nodeList = new java.util.ArrayList<>();
        for (Integer n : nodes) {
            java.util.Map<String, Object> nodeObj = new java.util.HashMap<>();
            nodeObj.put("id", n);
            nodeObj.put("label", formatNode(n));
            nodeList.add(nodeObj);
        }

        java.util.Map<String, Object> out = new java.util.HashMap<>();
        out.put("nodes", nodeList);
        out.put("edges", edges);
        return out;
    }
}