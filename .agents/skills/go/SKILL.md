---
name: go
description: Master-level Go (Golang) systems engineering. Covers Go 1.22+ idioms, Goroutines, buffered/unbuffered channels, context propagation, generic constraints, pprof profiling, memory allocation reduction, and high-throughput network services.
---

# Go (Golang) Systems & High-Throughput Engineering

This skill provides exhaustive guidance on engineering concurrent, low-latency, resilient distributed systems and microservices in Go (1.22+).

---

## 1. Concurrency Patterns, Channels & Context Cancellation

### Goroutine Leak Prevention & Structured Teardown
Never fire a goroutine without knowing exactly when and how it terminates. Always bind goroutine lifecycles to `context.Context` and synchronize termination using `sync.WaitGroup`:

```go
package worker

import (
	"context"
	"errors"
	"log"
	"sync"
	"time"
)

type Job struct {
	ID      string
	Payload []byte
}

type Pool struct {
	jobs    chan Job
	results chan error
	wg      sync.WaitGroup
}

func NewPool(workerCount int, queueSize int) *Pool {
	return &Pool{
		jobs:    make(chan Job, queueSize),
		results: make(chan error, queueSize),
	}
}

func (p *Pool) Start(ctx context.Context, workerCount int) {
	for i := 0; i < workerCount; i++ {
		p.wg.Add(1)
		go func(workerID int) {
			defer p.wg.Done()
			for {
				select {
				case <-ctx.Done():
					log.Printf("Worker %d: shutting down gracefully\n", workerID)
					return
				case job, ok := <-p.jobs:
					if !ok {
						return // Channel closed
					}
					p.processJob(ctx, job)
				}
			}
		}(i)
	}
}

func (p *Pool) processJob(ctx context.Context, j Job) {
	// Respect context timeout during execution
	select {
	case <-ctx.Done():
		p.results <- ctx.Err()
	case <-time.After(50 * time.Millisecond):
		p.results <- nil
	}
}
```

---

## 2. Generics & Type Constraints (Go 1.22+)

Leverage Go type parameters without runtime interface boxing allocations:

```go
package collections

import "cmp"

// Ordered constraint covers float, int, string
func BinarySearch[T cmp.Ordered](slice []T, target T) (int, bool) {
	low := 0
	high := len(slice) - 1

	for low <= high {
		mid := int(uint(low+high) >> 1)
		if slice[mid] == target {
			return mid, true
		}
		if slice[mid] < target {
			low = mid + 1
		} else {
			high = mid - 1
		}
	}
	return low, false
}
```

---

## 3. High-Performance Memory & `sync.Pool`

Reduce Garbage Collector (GC) pressure in high-throughput network handlers by reusing heap allocations:

```go
package bufferpool

import (
	"bytes"
	"sync"
)

var bufPool = sync.Pool{
	New: func() any {
		// Pre-allocate 4KB slice to avoid reallocation during request handling
		b := make([]byte, 0, 4096)
		return bytes.NewBuffer(b)
	},
}

func ProcessPacket(data []byte) []byte {
	buf := bufPool.Get().(*bytes.Buffer)
	buf.Reset()
	defer bufPool.Put(buf)

	buf.WriteString("PREFIX:")
	buf.Write(data)
	return append([]byte(nil), buf.Bytes()...) // Clone slice before returning
}
```

---

## 4. Go Profiling & Diagnostics (`pprof`)

- **Profile CPU & Heap via HTTP**:
  ```go
  import _ "net/http/pprof"

  go func() {
      log.Println(http.ListenAndServe("localhost:6060", nil))
  }()
  ```
- **Analyze Traces & Flamegraphs**:
  ```bash
  go tool pprof -http=:8080 http://localhost:6060/debug/pprof/profile?seconds=30
  go tool pprof -http=:8080 http://localhost:6060/debug/pprof/heap
  ```

---

## 5. Go Engineering Checklist

- [ ] **Context as First Parameter**: Standardize `ctx context.Context` as the first argument in all I/O or long-running functions.
- [ ] **Error Wrapping**: Use `fmt.Errorf("reading header: %w", err)` to preserve causal error chains for `errors.Is` and `errors.As`.
- [ ] **Mutex Granularity**: Keep critical sections minimal; never hold a `sync.Mutex` across network I/O calls.
- [ ] **Data Race Verification**: Verify tests pass with the race detector enabled: `go test -race ./...`.
