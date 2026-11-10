---
name: python
description: Master-level Python engineering. Covers Python 3.12+ features, strict typing (mypy/pyright), async asyncio event loops, Pydantic v2 validation, memory profiling, C extensions, and fast modern packaging with uv.
---

# Modern Python 3.12+ Systems & Application Engineering

This skill provides exhaustive reference for writing high-performance, strictly typed, idiomatic Python adhering to modern Python 3.12+ standards and modern packaging ecosystems (`uv`, `ruff`, `pydantic v2`).

---

## 1. Modern Type System & Python 3.12 Generics

### New Syntax for Type Parameters (PEP 695)
Python 3.12 introduces native generic type parameters without importing `TypeVar` or `Generic`:

```python
from collections.abc import Sequence, Callable
from typing import override

# Native generic class syntax in Python 3.12+
class Repository[T: ModelBase, ID: (int, str)]:
    def __init__(self) -> None:
        self._storage: dict[ID, T] = {}

    def get_by_id(self, entity_id: ID) -> T | None:
        return self._storage.get(entity_id)

    def persist(self, entity_id: ID, entity: T) -> None:
        self._storage[entity_id] = entity

# Native generic function syntax
def map_elements[In, Out](items: Sequence[In], transform: Callable[[In], Out]) -> list[Out]:
    return [transform(item) for item in items]
```

### Protocol Structural Subtyping (Duck Typing with Verification)
```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class Serializable(Protocol):
    def to_json_bytes(self) -> bytes:
        ...
```

---

## 2. Pydantic v2 Core Validation & Performance

Pydantic v2 utilizes a Rust-powered validation core (`pydantic-core`), executing 5-20x faster than v1:

```python
from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime, timezone

class UserProfileDTO(BaseModel):
    model_config = ConfigDict(
        frozen=True,               # Immutable data model
        str_strip_whitespace=True, # Auto-trim string inputs
        extra='forbid',            # Disallow undeclared fields
    )

    user_id: str = Field(..., pattern=r'^[a-f0-9]{32}$')
    email: str = Field(..., max_length=254)
    reputation: int = Field(default=0, ge=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator('email')
    @classmethod
    def validate_email_domain(cls, v: str) -> str:
        domain = v.split('@')[-1].lower()
        if domain in {'tempmail.com', 'disposable.org'}:
            raise ValueError('Disposable email providers are disallowed.')
        return v.lower()
```

---

## 3. Asynchronous Concurrency with `asyncio.TaskGroup`

Python 3.11+ provides structured concurrency via `asyncio.TaskGroup`. Never use raw `asyncio.gather` for background tasks, as it can leak orphaned running tasks on exceptions:

```python
import asyncio
from typing import Any

async def fetch_api(endpoint: str) -> dict[str, Any]:
    await asyncio.sleep(0.1) # Simulate HTTP I/O
    return {"endpoint": endpoint, "status": "ok"}

async def orchestrate_concurrent_fetches(endpoints: list[str]) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []

    # Structured Concurrency: If one task raises, all remaining tasks are cleanly cancelled
    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(fetch_api(ep)) for ep in endpoints]

    # After the context exits, all tasks are guaranteed completed
    return [t.result() for t in tasks]
```

---

## 4. Modern Tooling with `uv` & `ruff`

- **Dependency Management & Virtualenv**:
  ```bash
  uv venv .venv
  uv pip install -e ".[dev]"
  uv run pytest
  ```
- **Blazing Fast Linting & Formatting**:
  ```bash
  ruff check --fix .
  ruff format .
  ```

---

## 5. Python Engineering Checklist

- [ ] **Strict Typing**: Code passes `mypy --strict` or `pyright` with zero implicit `Any` types.
- [ ] **No Mutable Default Arguments**: Never write `def func(items=[])`. Use `def func(items: list[str] | None = None)`.
- [ ] **Resource Context Managers**: Always acquire files, locks, database connections, and HTTP clients within `with` or `async with` blocks.
- [ ] **Memory Management**: Use `__slots__` for data-heavy classes that instantiate millions of objects to reduce RAM consumption by ~60%.
