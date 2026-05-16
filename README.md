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

## Run locally

You need Java 17. Maven Wrapper is included, so you do not need a machine-wide Maven install.

```bash
./mvnw spring-boot:run
```

If you prefer packaging first:

```bash
./mvnw clean package
java -jar target/slotify-1.0.0.jar
```

## Notes

On Windows, use `mvnw.cmd` instead of `./mvnw`.