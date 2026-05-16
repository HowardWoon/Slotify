# Slotify

Slotify is a Spring Boot parking management demo built around multiple data structures working together in one flow:

- `VehicleLinkedList` stores vehicles in arrival order and supports reverse traversal.
- `GateManager` manages the entrance queue and undo stack.
- `SlotAssigner` uses a manual min-heap to assign the nearest available slot.
- `RouteGraph` computes the shortest route with Dijkstra and exports the graph for visualization.
- `SystemDatabase` combines a hash map for fast lookup with an AVL-balanced BST for ordered search.

## What It Does

On startup, the app loads demo parking slots and routes, then runs a boot demo from `CommandLineRunner` so you can see the data-structure flow immediately. A vehicle arrival touches the queue, linked list, hash map, and AVL tree. Processing then assigns a slot, calculates a route, and records undo data. Undo reverses the processed entry across the system.

## Strategic Upgrade Report

### Summary Of Implemented Upgrades

- Dijkstra: `RouteGraph.findShortestPath` returns the full path, and `exportAsDot()` provides visualization output.
- Graph: the lot is expanded to nodes `0..8` with slots `101..105` connected to multiple nodes for richer pathfinding.
- Manual Min-Heap: `ManualMinHeap` implements `insert`, `extractMin`, `heapifyUp`, and `heapifyDown`.
- AVL BST: `SystemDatabase` keeps vehicle records in an AVL-balanced BST with `getAllSorted()`.
- Doubly-linked list: `VehicleLinkedList` supports reverse traversal and plate-based removal.
- Undo: `UndoAction` stores the vehicle, assigned slot, and timestamp, and `ParkingService.undo()` reverses the assignment and releases the slot.

### Complexity Summary

- Queue arrival: enqueue `O(1)`, dequeue `O(1)`.
- Stack undo: push/pop `O(1)`.
- Min-heap slot assignment: insert `O(log n)`, extract-min `O(log n)`.
- AVL BST records: insert/search/delete `O(log n)`.
- HashMap fast cache: average lookup `O(1)`.
- Doubly linked list: add `O(1)`, remove by plate `O(n)` because the node must be searched.

### Demo Notes

Run the Spring Boot application and watch the `CommandLineRunner` output. It demonstrates arrivals, processing, undo, sorted listing, and prints a Graphviz DOT string for the route graph. You can paste the DOT output into a Graphviz renderer or use `dot -Tpng` locally.

### Report Takeaways

- The parking lot is modeled as a weighted graph with bidirectional routes.
- The AVL tree avoids worst-case BST degeneration and keeps search stable.
- The hash map gives fast plate-number retrieval while the BST preserves ordered traversal.
- The min-heap keeps slot selection nearest-first instead of naive linear scanning.
- The undo stack preserves full action payload so a processed entry can be rolled back cleanly.

## API Endpoints

- `POST /api/arrive?plate=ABC-123&name=Alice`
- `POST /api/process`
- `POST /api/undo`
- `GET /api/search?plate=ABC-123`
- `GET /api/all`
- `GET /api/map`
- `GET /api/mapdot`
- `GET /api/stats`
- `GET /api/slots`
- `POST /api/exit?plate=ABC-123`

## Installation And Run

You need Java 17 or newer. Maven Wrapper is included, so you do not need a system-wide Maven install.

### Windows

```bash
mvnw.cmd spring-boot:run
```

### macOS / Linux

```bash
./mvnw spring-boot:run
```

If you prefer packaging first:

```bash
mvnw.cmd clean package
java -jar target/slotify-1.0.0.jar
```

### Access The App

Open your browser at:

```text
http://localhost:8081
```

## Notes

- Run the project through Maven Wrapper, not by using the editor's single-file Java runner.
- If port `8081` is already in use, stop the previous Slotify instance or change `server.port` in `src/main/resources/application.properties`.