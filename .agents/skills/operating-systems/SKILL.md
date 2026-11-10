---
name: operating-systems
description: Master-level operating systems engineering. Covers virtual memory architectures, multi-level page tables, TLB shootdowns, process/thread scheduling, inter-process communication (IPC: shared memory, Unix domain sockets), and synchronization primitives.
---

# Operating Systems Architecture & Kernel Primitives

This skill provides exhaustive guidance on operating systems internals, memory virtualization, CPU scheduling algorithms, and low-level synchronization primitives.

---

## 1. Virtual Memory Architecture & Multi-Level Page Tables

### 64-Bit Virtual Address Space Decomposition (x86-64 4-Level Paging)
A 48-bit canonical virtual address is partitioned into five distinct bitfields:

$$\text{Virtual Address } [47:0] = \text{PML4}[9] \,|\, \text{PDPT}[9] \,|\, \text{PD}[9] \,|\, \text{PT}[9] \,|\, \text{Offset}[12]$$

1. **PML4 (Page Map Level 4)**: Bits 47–39 (Index into $512$ entries).
2. **PDPT (Page Directory Pointer Table)**: Bits 38–30 (Index into $512$ entries).
3. **PD (Page Directory)**: Bits 29–21 (Index into $512$ entries).
4. **PT (Page Table)**: Bits 20–12 (Index into $512$ physical page addresses).
5. **Physical Offset**: Bits 11–0 ($4096\text{ bytes} = 4\,\text{KB}$ page frame boundary).

### Translation Lookaside Buffer (TLB) & Shootdowns
The MMU caches page table translations in the hardware TLB. When an OS unmaps or modifies page permissions across multiple CPU cores:
- The initiating core sends an **Inter-Processor Interrupt (IPI)** to all cores running threads in that address space.
- Receiving cores flush their local TLB entries via `invlpg`. This is a high-cost overhead known as a **TLB Shootdown**.

---

## 2. Low-Level Synchronization Primitives & Cache Coherence

### Cache Coherence Protocols (MESI & MOESI)
Multi-core CPUs maintain cache line integrity through state machines:
- **Modified (M)**: Line is present only in current cache and dirty (inconsistent with RAM).
- **Exclusive (E)**: Line is clean and present only in current cache.
- **Shared (S)**: Line is clean and present in multiple processor caches.
- **Invalid (I)**: Line contains stale data; must be re-fetched on read.

### Futex (Fast Userspace Mutex)
Modern OS mutexes (Linux `futex`, Windows `WaitOnAddress`, macOS `os_unfair_lock`) avoid expensive kernel context switches in uncontended paths:

```c
// Uncontended Acquisition: 1 atomic compare-and-swap (CAS) instruction in userspace
if (__atomic_compare_exchange_n(&mutex->state, &expected_zero, 1, false, __ATOMIC_ACQUIRE, __ATOMIC_RELAXED)) {
    // Lock acquired with zero kernel transitions!
    return;
}

// Contended Path: Enter kernel to put calling thread to sleep until awakened
syscall(SYS_futex, &mutex->state, FUTEX_WAIT_PRIVATE, 1, NULL, NULL, 0);
```

---

## 3. High-Performance Inter-Process Communication (IPC)

### Comparison of IPC Bandwidth & Latency:
1. **Shared Memory (`mmap` / POSIX `shm_open`)**: Zero-copy. Highest throughput ($\sim 20-50\,\text{GB/s}$). Requires atomic locks or lock-free ring buffers for synchronization.
2. **Unix Domain Sockets (`AF_UNIX`)**: Stream/Datagram semantics with credential passing (`SCM_RIGHTS` to transfer open file descriptors). Throughput $\sim 4-8\,\text{GB/s}$.
3. **Anonymous Pipes (`pipe2`)**: Unidirectional byte stream with FIFO semantics. Bottlenecked by kernel buffer limits ($64\,\text{KB}$).

---

## 4. Operating Systems Engineering Checklist

- [ ] **False Sharing Avoidance**: Ensure variables accessed by different threads reside on distinct $64\text{-byte}$ cache lines using `alignas(64)`.
- [ ] **File Descriptor Leaks**: Always mark created sockets and file descriptors with `O_CLOEXEC` to prevent accidental inheritance across `fork`/`exec`.
- [ ] **Deadlock Invariants**: Establish a strict, global lock acquisition ordering hierarchy across all subsystems.
