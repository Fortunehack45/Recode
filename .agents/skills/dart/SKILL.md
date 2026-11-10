---
name: dart
description: Master-level Dart 3.x engineering. Covers sound null-safety, algebraic data types, pattern matching, switch expressions, records, primary constructors, asynchronous streams, Isolates concurrency, and C/FFI interop.
---

# Dart 3.x Master Engineering

This skill provides exhaustive reference for writing idiomatic, high-performance, soundly typed Dart 3 code. Apply these patterns when architecting Dart CLIs, Flutter backbones, background engines, or low-level systems integrations.

---

## 1. Type System, Pattern Matching & Destructuring

### Exhaustive Pattern Matching with Sealed Hierarchies
Never use loose string codes or mutable class hierarchies for modeling discrete states. Use `sealed class` with pattern matching to guarantee compile-time exhaustiveness:

```dart
sealed class NetworkResult<T> {
  const NetworkResult();
}

final class Success<T> extends NetworkResult<T> {
  final T data;
  final Duration latency;
  const Success(this.data, this.latency);
}

final class Failure<T> extends NetworkResult<T> {
  final String message;
  final int statusCode;
  final StackTrace stackTrace;
  const Failure(this.message, this.statusCode, this.stackTrace);
}

final class Loading<T> extends NetworkResult<T> {
  final double? progress;
  const Loading([this.progress]);
}

// Exhaustive Switch Expression (Compile Error if any subtype is missing)
String renderStatus<T>(NetworkResult<T> result) => switch (result) {
  Success(data: final d, latency: final lat) => 'Loaded ${d.toString()} in ${lat.inMilliseconds}ms',
  Failure(statusCode: >= 500, message: final msg) => 'Server Error ($msg)',
  Failure(statusCode: 404) => 'Resource Not Found',
  Failure(message: final msg) => 'Client Error: $msg',
  Loading(progress: final p?) => 'Loading: ${(p * 100).toStringAsFixed(1)}%',
  Loading() => 'Loading...',
};
```

### Records & Destructuring
Dart 3 records provide lightweight, anonymous, immutable tuples with named or positional fields:

```dart
// Multi-return function with typed record
(int count, {double average, bool hasOutliers}) analyzeMetrics(List<double> numbers) {
  if (numbers.isEmpty) return (0, average: 0.0, hasOutliers: false);
  final sum = numbers.reduce((a, b) => a + b);
  final avg = sum / numbers.length;
  final outliers = numbers.any((n) => (n - avg).abs() > 20);
  return (numbers.length, average: avg, hasOutliers: outliers);
}

// Destructuring in variable declaration
final (count, average: avg, hasOutliers: isOutlier) = analyzeMetrics([12.0, 15.5, 98.2]);
```

---

## 2. Asynchronous Concurrency: Streams, Futures & Isolates

### Isolate Spawning & Two-Way Port Communication
Heavy computations (cryptography, large JSON parsing, image manipulation) must never block the main event loop. Spawn an Isolate:

```dart
import 'dart:isolate';

class ComputationRequest {
  final List<int> payload;
  final SendPort replyPort;
  ComputationRequest(this.payload, this.replyPort);
}

Future<List<int>> runHeavyProcessing(List<int> input) async {
  final receivePort = ReceivePort();
  await Isolate.spawn(_isolateWorker, ComputationRequest(input, receivePort.sendPort));
  
  final result = await receivePort.first as List<int>;
  receivePort.close();
  return result;
}

void _isolateWorker(ComputationRequest request) {
  // Heavy transformation runs on independent OS thread
  final transformed = request.payload.map((e) => (e * 31) ^ 0xAA).toList();
  request.replyPort.send(transformed);
}
```

### Advanced Stream Transformations
```dart
Stream<String> bufferAndThrottle(Stream<String> input, Duration throttle) async* {
  DateTime? lastEmit;
  await for (final item in input) {
    final now = DateTime.now();
    if (lastEmit == null || now.difference(lastEmit) >= throttle) {
      lastEmit = now;
      yield item;
    }
  }
}
```

---

## 3. High-Performance Memory & FFI (Foreign Function Interface)

### C-Interop via `dart:ffi`
Call native C dynamic libraries with zero overhead and direct memory pointers:

```dart
import 'dart:ffi' as ffi;
import 'package:ffi/ffi.dart';

// C Signature: int add_numbers(int a, int b)
typedef NativeAdd = ffi.Int32 Function(ffi.Int32 a, ffi.Int32 b);
typedef DartAdd = int Function(int a, int b);

class NativeBridge {
  late final DartAdd add;

  NativeBridge(ffi.DynamicLibrary lib) {
    add = lib.lookupFunction<NativeAdd, DartAdd>('add_numbers');
  }

  // Memory allocation with native malloc/free
  void allocateAndProcess() {
    final pointer = calloc<ffi.Uint8>(1024);
    try {
      pointer.value = 42;
      // perform pointer arithmetic
    } finally {
      calloc.free(pointer);
    }
  }
}
```

---

## 4. Dart Code Quality Checklist

- [ ] **Strict Analysis Options**: Enable `strict-casts`, `strict-inference`, and `strict-raw-types` in `analysis_options.yaml`.
- [ ] **Immutability First**: Mark classes `const` and fields `final` wherever possible.
- [ ] **Null-Safety Invariants**: Avoid forced bangs (`!`); use `if (x != null)` type promotion or pattern extraction.
- [ ] **Stream Subscriptions**: Always cancel `StreamSubscription` instances in teardown/dispose logic to prevent memory leaks.
- [ ] **Async Await Safety**: Handle `try/catch` around `await` expressions; avoid unhandled asynchronous exceptions in fire-and-forget calls.
