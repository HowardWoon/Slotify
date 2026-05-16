# Slotify

Slotify is a Spring Boot parking management demo built around core data structures:

- `VehicleLinkedList` for storing vehicles in arrival order
- `GateManager` for queue-based gate handling and undo support
- `SlotAssigner` for priority-based slot allocation
- `RouteGraph` for shortest-route lookups
- `SystemDatabase` for fast search with a hash map plus BST index

## What it does

On startup, the application loads a few demo parking slots and routes, then prints a small boot demo from `CommandLineRunner` so you can immediately see the data-structure flow in action.

API endpoints:

- `POST /api/arrive?plate=ABC-123&name=Alice`
- `POST /api/process`
- `POST /api/undo`
- `GET /api/search?plate=ABC-123`
- `GET /api/all`

## Installation & Run

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

### Access the app

Open your browser at:

```text
http://localhost:8080
```

## Notes

- Run the project through Maven Wrapper, not by using the editor's single-file Java runner.
- If port `8080` is already in use, stop the previous Slotify instance or change `server.port` in `src/main/resources/application.properties`.