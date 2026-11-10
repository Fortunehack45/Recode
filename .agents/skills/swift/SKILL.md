---
name: swift
description: Master-level Swift 6+ systems and application engineering. Covers strict compile-time concurrency, Actor isolation, Sendable checks, modern SwiftUI state architecture, SwiftData persistence, and StoreKit 2.
---

# Swift 6+ Systems & Apple Native Engineering

This skill provides exhaustive guidance on writing high-performance, strictly concurrent, memory-safe Swift 6 code for macOS, iOS, watchOS, and server-side Swift.

---

## 1. Swift 6 Strict Concurrency & Actor Isolation

Swift 6 enables complete data race safety at compile time. Data cannot cross concurrency boundaries without satisfying `Sendable` invariants.

### Global Actors & Isolated Mutexes
Use `@MainActor` for UI binding and custom `actor` instances for thread-safe state encapsulation:

```swift
import Foundation

// Thread-safe state engine via Actor isolation
public actor DistributedCacheManager {
    private var cache: [String: (data: Data, expiresAt: Date)] = [:]

    public init() {}

    public func set(_ key: String, data: Data, ttl: TimeInterval) {
        let expiration = Date().addingTimeInterval(ttl)
        cache[key] = (data, expiration)
    }

    public func get(_ key: String) -> Data? {
        guard let entry = cache[key] else { return nil }
        if Date() > entry.expiresAt {
            cache.removeValue(forKey: key)
            return nil
        }
        return entry.data
    }

    public func purgeExpired() {
        let now = Date()
        cache = cache.filter { $0.value.expiresAt > now }
    }
}
```

### `Sendable` Protocol Enforcement
Types transferred between concurrent tasks or actors must be `Sendable` (immutable structs, actors, or synchronized classes):

```swift
// Sendable immutable value type
public struct MetricPayload: Sendable {
    public let id: UUID
    public let timestamp: Date
    public let values: [Double]

    public init(id: UUID = UUID(), timestamp: Date = Date(), values: [Double]) {
        self.id = id
        self.timestamp = timestamp
        self.values = values
    }
}
```

---

## 2. Modern SwiftUI State Management with Observation (`@Observable`)

Swift 5.9+ and Swift 6 replace `ObservableObject` and `@Published` with the high-performance, macro-based `@Observable` framework:

```swift
import SwiftUI
import Observation

@Observable
@MainActor
public final class WorkspaceState {
    public var activeProjectName: String = "Untitled"
    public var isTerminalVisible: Bool = false
    public var fontSize: Double = 15.0

    public init() {}

    public func toggleTerminal() {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
            isTerminalVisible.toggle()
        }
    }
}

public struct WorkspaceView: View {
    @Bindable var state: WorkspaceState

    public var body: some View {
        VStack {
            Text(state.activeProjectName)
                .font(.headline)

            Slider(value: $state.fontSize, in: 10...32) {
                Text("Font Size")
            }

            if state.isTerminalVisible {
                Text("Terminal Output Active")
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }

            Button("Toggle Terminal") {
                state.toggleTerminal()
            }
        }
        .padding()
    }
}
```

---

## 3. SwiftData Modern Persistence

```swift
import SwiftData
import Foundation

@Model
public final class WorkspaceSession {
    @Attribute(.unique) public var id: UUID
    public var title: String
    public var lastOpened: Date

    public init(id: UUID = UUID(), title: String, lastOpened: Date = Date()) {
        self.id = id
        self.title = title
        self.lastOpened = lastOpened
    }
}
```

---

## 4. Swift Engineering Checklist

- [ ] **Strict Concurrency Flag**: Verify `-strict-concurrency=complete` is enabled in build settings.
- [ ] **No Force Unwrapping**: Avoid `!` operator; use `guard let`, `if let`, or default coalescing `??`.
- [ ] **Retain Cycle Auditing**: Use `[weak self]` in closures capturing reference types to avoid memory leaks.
- [ ] **Task Cancellation Handling**: Call `try Task.checkCancellation()` periodically inside compute loops.
