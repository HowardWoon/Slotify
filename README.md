<div align="center">

# 🅿️ Slotify

**A Spring Boot parking management system built to demonstrate multiple data structures working together in one cohesive flow.**

[![Java](https://img.shields.io/badge/Java-17+-ED8B00?style=flat-square&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=flat-square&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Maven](https://img.shields.io/badge/Maven_Wrapper-included-C71A36?style=flat-square&logo=apachemaven&logoColor=white)](https://maven.apache.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

</div>

---

## Overview

Slotify is a parking management demo where every action — vehicle arrival, slot assignment, route calculation, search, and undo — flows through a hand-implemented data structure stack. There is no `java.util.PriorityQueue` or `TreeMap` doing the heavy lifting invisibly; each structure is built from scratch and exercised end-to-end.

On startup, a `CommandLineRunner` boot demo fires automatically, so you can observe the full data-structure pipeline in your terminal without making a single API call.

---

## Architecture: Data Structures at a Glance

| Component | Structure | Role |
|---|---|---|
| `VehicleLinkedList` | Doubly linked list | Stores vehicles in arrival order; supports reverse traversal and plate-based removal |
| `GateManager` | Queue + undo stack | Manages the entrance queue; stack records actions for reversal |
| `SlotAssigner` | Manual min-heap | Assigns the nearest available slot — `O(log n)` insert and extract |
| `RouteGraph` | Weighted graph + Dijkstra | Computes the shortest path through the lot; exports a Graphviz DOT string |
| `SystemDatabase` | HashMap + AVL BST | HashMap for `O(1)` plate lookups; AVL tree for stable ordered search and traversal |

A single vehicle arrival touches **all five structures** in sequence: queue → linked list → hash map → AVL tree → heap assignment → route → undo stack.

---

## How It Works

### Vehicle arrival
1. The plate is enqueued in `GateManager`.
2. The vehicle is appended to `VehicleLinkedList` (arrival order preserved).
3. The record is inserted into `SystemDatabase` — stored in both the HashMap and AVL BST simultaneously.

### Processing
4. The front of the queue is dequeued.
5. `SlotAssigner` extracts the minimum slot from the min-heap (nearest available).
6. `RouteGraph` runs Dijkstra from the gate node to the assigned slot node and returns the full path.
7. An `UndoAction` (vehicle + slot + timestamp) is pushed onto the undo stack.

### Undo
8. The top `UndoAction` is popped.
9. The vehicle is removed from the linked list by plate, deleted from the AVL tree and hash map, and the slot is returned to the min-heap.

### Search and listing
- Plate-based lookup hits the HashMap directly — `O(1)` average.
- `getAllSorted()` performs an in-order traversal of the AVL BST — keys returned in alphabetical order with no extra sorting step.

---

## Interactive Dashboard (Frontend)

The system includes a fully responsive, high-fidelity web command center (`http://localhost:8081`) that visually exposes and animates the underlying data structures in real-time:
- **High-Tech Branded OS Boot Loader:** Features a modern, advanced full-screen radar HUD concentric ring loader with progressive status animations, a segmented loading bar, and active Node/Sensor panels to eliminate white browser flashes.
- **Visual Doubly Linked List Pointers:** Every vehicle database card displays live Prev and Next node memory link addresses (`Prev: [PLATE] ↔ Next: [PLATE]`) directly on-screen to illustrate dynamic RAM linkages.
- **Collapsible LIFO Stack Action Panel:** Renders Gate Operations backtrack history. Custom green `PUSH` and red `POP` badges flash during action updates.
- **Min-Heap Triangle Tree Visualizer:** Available slots are displayed as a geometric binary tree, animating extract-min transitions and priority bubble-up re-heapification in real-time.
- **Dijkstra pathing HUD & Edge Weights:** Graph driveways display glowing active edge distances. A canvas HUD overlay displays Dijkstra's algorithm time complexity alongside calculated `Explored Nodes` and `Shortest Path` node sizes.
- **AVL Balanced BST Traversal:** In Database view, toggle `"Tree View [AVL]"` to observe a balanced alphabetic search tree. Plate queries sequentially pulse down left or right branches before flashing the target green.
- **Hash Table Glow Flash:** Highlights the direct bucket slot match for $O(1)$ lookups with neon-cyan border sweeps for 1.5 seconds.
- **System Integration Architecture Table:** Displays a technical summary tracing the concrete role and space/time complexities of all 7 data structures.
- **Intelligent Layout Polish:** Clean multiline wrapping on pathing routes, sleek custom timeline scrollbars, and vibrant neon accents for clear, overlap-free dashboards.

---

## Complexity Summary

| Operation | Structure | Complexity |
|---|---|---|
| Enqueue / dequeue | Queue | `O(1)` |
| Undo push / pop | Stack | `O(1)` |
| Slot insert | Min-heap | `O(log n)` |
| Slot extract-min | Min-heap | `O(log n)` |
| Record insert / search / delete | AVL BST | `O(log n)` |
| Plate lookup | HashMap | `O(1)` avg |
| Remove by plate | Doubly linked list | `O(n)` — node must be located first |
| Shortest path | Dijkstra (adjacency list) | `O((V + E) log V)` |

---

## Graph Layout

The lot is modelled as a weighted, bidirectional graph with nodes `0..8`. Slots `101..105` are each connected to multiple graph nodes, giving Dijkstra genuine routing choices rather than a trivial single-path graph.

```
Gate (node 0) ──── 1 ──── 2
    │                     │
    3 ──── 4 ──── 5 ──── 6
    │             │
    7 ──────────── 8
    │
 Slots 101–105 (connected to multiple nodes)
```

Paste the output of `GET /api/mapdot` into [Graphviz Online](https://dreampuf.github.io/GraphvizOnline/) or run locally:

```bash
dot -Tpng slotify.dot -o slotify.png
```

---

## API Reference

### Parking flow

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/arrive?plate=ABC-123&name=Alice` | Register a vehicle arrival and add it to the queue |
| `POST` | `/api/process` | Dequeue the next vehicle, assign a slot, and calculate its route |
| `POST` | `/api/undo` | Reverse the last processed entry across all structures |
| `POST` | `/api/exit?plate=ABC-123` | Mark a vehicle as departed and release its slot back to the heap |

### Query

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/search?plate=ABC-123` | Plate lookup via HashMap (`O(1)` avg). Returns vehicle info along with real-time status (In Queue or Parked with Slot ID). |
| `GET` | `/api/all` | All vehicle records in arrival order (Doubly Linked List reverse traversal). |
| `GET` | `/api/sorted` | All vehicles sorted alphabetically by plate (AVL BST in-order traversal) |
| `GET` | `/api/slots` | Current available slot list from the min-heap |
| `GET` | `/api/stats` | System statistics and live `queueDetails` array used for dynamic FIFO queue UI visualization. |

### Visualisation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/map` | Route graph as a human-readable adjacency list |
| `GET` | `/api/mapdot` | Route graph as a Graphviz DOT string for rendering |

---

## Getting Started

### Prerequisites

- **Java 21 or newer** — check with `java -version`
- No system-wide Maven required — the Maven Wrapper (`mvnw` / `mvnw.cmd`) is included

### Run

We have included automated execution scripts so you don't need to install anything other than Java. The scripts will automatically download Maven and all required dependencies on the first run.

**Windows (Double-click)**
Simply double-click `run.bat` in your file explorer, or run in terminal:
```bash
run.bat
```

**macOS / Linux**
```bash
./run.sh
```

*(Alternatively, you can manually use `./mvnw spring-boot:run`)*

**Package and run the JAR directly**
```bash
# Windows
mvnw.cmd clean package
java -jar target/slotify-1.0.0.jar

# macOS / Linux
./mvnw clean package
java -jar target/slotify-1.0.0.jar
```

### Access

Once the app starts, open:

```
http://localhost:8081
```

The boot demo output appears in your terminal immediately — arrivals, processing, undo, sorted listing, and the DOT graph string are all printed before you make any API call.

---

## Boot Demo Output

The `CommandLineRunner` executes this sequence automatically on every startup:

```
[ARRIVE]   ABC-123 (Alice)  → queued, added to linked list + AVL + HashMap
[ARRIVE]   XYZ-999 (Bob)    → queued, added to linked list + AVL + HashMap
[PROCESS]  ABC-123          → slot 101 assigned | route: 0 → 3 → 7 → 101
[PROCESS]  XYZ-999          → slot 102 assigned | route: 0 → 1 → 4 → 102
[UNDO]     XYZ-999          → slot 102 released, record removed, queue restored
[SORTED]   All vehicles (AVL in-order): ABC-123, XYZ-999
[DOT]      digraph slotify { ... }
```

---

## Project Structure

```
slotify/
├── src/main/java/com/slotify/
│   ├── ds/
│   │   ├── VehicleLinkedList.java   ← Doubly Linked List vehicle database cache
│   │   ├── ManualMinHeap.java       ← Core Min-Heap Priority Queue logic
│   │   ├── RouteGraph.java          ← Bidirectional Graph + Dijkstra shortest path + DOT
│   │   ├── GateManager.java         ← Timeline Arrival Queue & Undo Action LIFO Stack
│   │   ├── SlotAssigner.java        ← Priority space allocation (Min-Heap wrapper)
│   │   ├── SystemDatabase.java      ← Direct O(1) HashMap cache & Balanced AVL Tree
│   │   └── UndoAction.java          ← Backtracking action model
│   ├── service/
│   │   └── ParkingService.java      ← Core workflow manager
│   ├── model/
│   │   └── Vehicle.java             ← Vehicle model
│   ├── controller/
│   │   └── ApiController.java       ← REST API endpoint controller
│   └── SlotifyApplication.java      ← CommandLineRunner boot sequence logger
└── src/main/resources/
    └── application.properties       ← server.port=8081
```

---

## Notes

- **Run via Maven Wrapper**, not your editor's single-file Java runner — the runner bypasses Spring Boot's application context.
- If port `8081` is already in use, stop the previous Slotify instance or change `server.port` in `src/main/resources/application.properties`.
- The AVL tree rebalances on every insert and delete, so `getAllSorted()` always returns stable ordered output regardless of insertion sequence.
- The min-heap is implemented entirely in `ManualMinHeap.java` with no reliance on `java.util.PriorityQueue` — `heapifyUp` fires on insert, `heapifyDown` fires on `extractMin`.
