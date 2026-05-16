# 🚗 Slotify

**Smart Parking & Traffic Management System**

Slotify is a full-stack parking management system designed to optimize vehicle flow, automate slot assignments, and provide real-time routing. Built with **Java Spring Boot**, the backend heavily relies on complex data structures to ensure highly efficient execution—from $O(1)$ data retrieval to dynamic pathfinding algorithms.

## ✨ Core Features & Algorithmic Implementation

This system solves real-world traffic management problems using the following data structures:

* **Real-Time Entry & Exit (Queue & Stack):** * Uses a **Queue (FIFO)** to process vehicles arriving at the entrance gate.
  * Implements a **Stack (LIFO)** to provide an instant "undo" mechanism for reversing accidental or erroneous gate entries.
* **Priority Slot Assignment (Min-Heap):** * Utilizes a **Priority Queue** to dynamically assign the absolute best parking slot available (based on the shortest distance from the entrance).
* **Smart Route Navigation (Graph + Dijkstra's Algorithm):** * Maps the parking lot as a **Graph** (nodes and edges) and calculates the shortest path from the entrance to the assigned slot using **Dijkstra's Algorithm**.
* **High-Speed Vehicle Search (BST & Hash Table):** * Integrates a **Binary Search Tree (BST)** for organized $O(\log n)$ searching and sorting of vehicle plates.
  * Implements a **HashMap** for lightning-fast, $O(1)$ constant-time retrieval of frequently accessed active parking records.
* **Dynamic Record Management (Linked List):** * Maintains a robust, dynamic history of all processed vehicles without the fixed-size limitations of standard arrays.

## 🛠️ Tech Stack

* **Backend:** Java 17, Spring Boot, RESTful APIs
* **Frontend:** HTML5, CSS3, JavaScript (Fetch API)
* **Architecture:** MVC (Model-View-Controller), Service-Oriented

## 🚀 Getting Started

### Prerequisites
* Java Development Kit (JDK) 17 or higher
* Maven
* Git

### Installation & Execution

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/HowardWoon/Slotify.git](https://github.com/HowardWoon/Slotify.git)
   cd Slotify

2. **Build and run the Spring Boot application:**

Bash
mvn spring-boot:run

3. **Access the Dashboard:**
Open your web browser and navigate to:
http://localhost:8080

**👥 Contributors**
Howard Woon (@HowardWoon) - Lead Developer / Project Manager

Tan Ker Li

Eugene

Chew Chen Xi

Yap Vincent

📄 License
This project is for academic and portfolio purposes.
