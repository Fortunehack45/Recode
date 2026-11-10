---
name: rust
description: Master-level Rust systems engineering. Covers memory safety, lifetime mechanics, zero-cost abstractions, trait bounds, unsafe audits, Tokio async concurrency, lock-free synchronization, and SIMD optimizations.
---

# Rust Systems Engineering & Memory Safety

This skill provides exhaustive guidance on writing high-performance, memory-safe, idiomatic Rust code adhering to modern standards (Rust 2021/2024 editions, Tokio, Rayon, and low-level systems engineering).

---

## 1. Ownership, Borrowing & Lifetime Engineering

### Lifetime Elision & Variance Mechanics
- **Covariance ($T \rightarrow U \implies F[T] \rightarrow F[U]$)**: Immutable references `&'a T` are covariant over `'a` and `T`. If `'a: 'b` (lifetime `'a` outlives `'b`), then `&'a T` can be used wherever `&'b T` is expected.
- **Invariance**: Mutable references `&'a mut T` are invariant over `T`. You cannot coerce `&mut &'static str` into `&mut &'a str` because it would permit writing shorter-lived references into static memory.
- **Contravariance**: Function arguments `Fn(T)` are contravariant over `T`.

### Self-Referential Structs & `Pin`
When dealing with self-referential futures or memory buffers, never attempt manual pointer gymnastics without `Pin`:
```rust
use std::marker::PhantomPinned;
use std::pin::Pin;

pub struct SelfReferentialBuffer {
    data: String,
    slice_pointer: *const u8,
    _pin: PhantomPinned, // Prevents Unpin implementation
}

impl SelfReferentialBuffer {
    pub fn new(text: String) -> Pin<Box<Self>> {
        let mut boxed = Box::pin(Self {
            data: text,
            slice_pointer: std::ptr::null(),
            _pin: PhantomPinned,
        });

        let ptr = boxed.data.as_ptr();
        // SAFETY: The struct is pinned in heap memory and cannot be moved
        unsafe {
            let mut_ref: Pin<&mut Self> = Pin::as_mut(&mut boxed);
            Pin::get_unchecked_mut(mut_ref).slice_pointer = ptr;
        }

        boxed
    }
}
```

---

## 2. Advanced Concurrency: Tokio & Lock-Free Primitives

### Tokio Async Scheduling & Work Stealing
- **Compute vs I/O Segregation**: Never execute CPU-heavy blocking work ($> 10\mu s$) inside the Tokio worker threads. Always dispatch CPU tasks to `tokio::task::spawn_blocking` or a dedicated `rayon` thread pool.
- **Graceful Cancellation via `tokio_util::sync::CancellationToken`**:
```rust
use tokio_util::sync::CancellationToken;
use std::sync::Arc;
use tokio::time::{sleep, Duration};

async fn worker_loop(token: CancellationToken) {
    loop {
        tokio::select! {
            _ = token.cancelled() => {
                log::info!("Cancellation received. Flushing buffers...");
                break;
            }
            _ = sleep(Duration::from_millis(500)) => {
                // Perform periodic polling or processing
            }
        }
    }
}
```

### Lock-Free Synchronization with Atomics
Use `AtomicUsize`, `AtomicBool`, and explicit memory orderings (`Acquire`, `Release`, `Relaxed`):
```rust
use std::sync::atomic::{AtomicUsize, Ordering};

pub struct LockFreeCounter {
    value: AtomicUsize,
}

impl LockFreeCounter {
    pub const fn new() -> Self {
        Self { value: AtomicUsize::new(0) }
    }

    pub fn increment(&self) -> usize {
        // Relaxed ordering is sufficient for simple monotonic counters
        self.value.fetch_add(1, Ordering::Relaxed)
    }

    pub fn read(&self) -> usize {
        self.value.load(Ordering::Acquire)
    }
}
```

---

## 3. Unsafe Rust Audits & Invariant Guarantees

Every `unsafe` block must be accompanied by an explicit `// SAFETY:` doc comment detailing:
1. Valid pointer invariants (non-null, properly aligned, dereferenceable for $N$ bytes).
2. Initialization invariants (memory is initialized before read).
3. Aliasing invariants (no concurrent mutable access or violating `noalias`).

```rust
pub struct AlignedSlice<T> {
    ptr: *mut T,
    len: usize,
    capacity: usize,
}

impl<T> AlignedSlice<T> {
    pub fn get(&self, index: usize) -> Option<&T> {
        if index < self.len {
            // SAFETY:
            // 1. `index` is bounds-checked against `self.len`.
            // 2. `self.ptr` is valid, non-null, and aligned for type `T`.
            // 3. No mutable references exist to this memory region during &'a self.
            unsafe { Some(&*self.ptr.add(index)) }
        } else {
            None
        }
    }
}
```

---

## 4. Rust Engineering Checklist

- [ ] **No Unchecked `unwrap()`**: Use `?` operator, `unwrap_or_else`, or explicit error handling with `thiserror` / `anyhow`.
- [ ] **Trait Bound Optimization**: Prefer `impl Trait` or generics with monomorphization for hot paths; use `Box<dyn Trait>` only when dynamic dispatch is strictly required.
- [ ] **Clippy & Miri Verification**: Run `cargo clippy --all-targets --all-features -- -D warnings` and run test suites under `cargo miri test` to detect UB in unsafe code.
- [ ] **Drop Semantics**: Ensure custom RAII types correctly implement `Drop` to release OS handles, sockets, and memory mappings.
