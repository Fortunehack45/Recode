---
name: linux
description: Master-level Linux systems engineering and kernel internals. Covers virtual filesystems (/proc, /sys), systemd unit architectures, eBPF observability, cgroups v2 resource quotas, namespaces, networking (ip, nftables), and performance profiling.
---

# Linux Systems Engineering & Kernel Internals

This skill provides exhaustive guidance on Linux systems administration, kernel mechanics, containerization primitives, and low-level diagnostic tooling.

---

## 1. Virtual Filesystems (`/proc` & `/sys`) Internals

Linux exposes kernel state and process runtime data through in-memory virtual filesystems:

### `/proc` Process Introspection
- `/proc/[pid]/cmdline`: Null-delimited (`\0`) original command arguments.
- `/proc/[pid]/fd/`: Symlinks to open file descriptors (sockets, pipes, files).
- `/proc/[pid]/smaps_rollup`: Summary of PSS (Proportional Set Size) and RSS memory usage.
- `/proc/[pid]/status`: Kernel scheduler state (voluntary vs involuntary context switches).
- `/proc/sys/vm/drop_caches`: Kernel cache eviction control.

### `/sys` Kernel Device Tree
- `/sys/class/net/`: Network interface driver metadata and MTU configurations.
- `/sys/devices/system/cpu/`: CPU topology, frequency governors, and vulnerability mitigations.

---

## 2. Container Primitives: Linux Namespaces & Cgroups v2

Modern containers (Docker, containerd) are built from two fundamental kernel subsystems:

### 1. Linux Namespaces (Process Isolation)
- `pid`: Process ID virtualization (process becomes PID 1 inside namespace).
- `net`: Isolated network devices, IP routes, port spaces, and firewall tables.
- `mnt`: Independent mount points and filesystem root (`pivot_root`).
- `ipc`: Isolated System V IPC and POSIX message queues.
- `uts`: Virtualized hostname and domain name.
- `user`: Root mapping (UID 0 inside namespace mapped to non-root UID 1000 on host).

### 2. Cgroups v2 (Unified Hierarchy Resource Limiting)
Managed via `/sys/fs/cgroup/`:
- `memory.max`: Hard memory ceiling. Process receives OOM-killer if exceeded.
- `memory.high`: Throttling boundary; kernel reclaims page cache before OOM.
- `cpu.max`: Quota and period (e.g. `200000 100000` = 2 full CPU cores).
- `io.weight`: Proportional block I/O scheduling weight ($1-10000$).

---

## 3. Production `systemd` Service Architecture

Author hardened, production-grade systemd service definitions:

```ini
# /etc/systemd/system/recode-daemon.service
[Unit]
Description=Recode Background LSP & Build Worker
Documentation=man:recode(1) https://recode.dev
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=recode
Group=recode
WorkingDirectory=/var/lib/recode
ExecStart=/usr/local/bin/recode-daemon --port 8080
Restart=always
RestartSec=5s

# Process Sandboxing & Hardening
ProtectSystem=strict
ProtectHome=true
ProtectKernelTunables=true
ProtectControlGroups=true
PrivateTmp=true
PrivateDevices=true
NoNewPrivileges=true
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX
RestrictRealtime=true

# Resource Quotas via Cgroups
MemoryMax=4G
CPUQuota=200%
TasksMax=1024

[Install]
WantedBy=multi-user.target
```

---

## 4. eBPF Tracing & Kernel Observability (`bpftrace`)

Inspect low-level syscall latency and I/O blocking without instrumenting binaries:

```bash
# Trace block I/O latency distribution (disk read/write duration)
bpftrace -e 'kprobe:vfs_read { @start[tid] = nsecs; } kretprobe:vfs_read /@start[tid]/ { @latency_us = hist((nsecs - @start[tid]) / 1000); delete(@start[tid]); }'

# Monitor process execution events across entire host
bpftrace -e 'tracepoint:syscalls:sys_enter_execve { printf("%-16s %s\n", comm, str(args->filename)); }'
```

---

## 5. Linux Engineering Checklist

- [ ] **System File Limits (`nofile`)**: Verify `/etc/security/limits.conf` has `nofile` set $\ge 65536$ for high-concurrency servers.
- [ ] **TCP Socket Tuning**: Ensure `net.ipv4.tcp_max_syn_backlog` and `net.core.somaxconn` are tuned $\ge 4096$.
- [ ] **Signal Handling**: Long-running daemons must capture `SIGTERM` and `SIGINT` to flush in-flight operations and exit $0$.
