---
name: kotlin
description: Master-level Kotlin engineering. Covers Kotlin 2.0+ (K2 compiler), Coroutines, StateFlow/SharedFlow, Jetpack Compose UI architecture, Kotlin Multiplatform (KMP), and memory management on Android/JVM/Native.
---

# Kotlin 2.0+ Systems & Mobile Architecture

This skill provides exhaustive guidance on engineering reactive, null-safe, concurrent applications in Kotlin across Android, JVM backends, and Kotlin Multiplatform (KMP).

---

## 1. Coroutines, Structured Concurrency & Dispatchers

### CoroutineScope Invariants
Never use `GlobalScope.launch`. Always bind coroutines to a defined lifecycle scope (`viewModelScope`, `lifecycleScope`, or custom `CoroutineScope(SupervisorJob() + Dispatchers.Default)`):

```kotlin
package com.recode.core.concurrency

import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

class RepositoryManager(
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) {
    private val scope = CoroutineScope(SupervisorJob() + ioDispatcher)

    // Parallel fetching with exception isolation
    suspend fun fetchAggregatedMetrics(endpoints: List<String>): List<String> = coroutineScope {
        endpoints.map { url ->
            async(ioDispatcher) {
                fetchSingleMetric(url)
            }
        }.awaitAll()
    }

    private suspend fun fetchSingleMetric(url: String): String {
        delay(100) // Non-blocking suspend
        return "Data from $url"
    }

    fun destroy() {
        scope.cancel() // Cancels all child coroutines cleanly
    }
}
```

---

## 2. Reactive Architecture: `StateFlow` vs `SharedFlow`

Model UI states with `StateFlow` (replay 1, distinct until changed) and one-shot events with `SharedFlow` / `Channel`:

```kotlin
package com.recode.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

sealed interface UiState {
    data object Loading : UiState
    data class Success(val items: List<String>) : UiState
    data class Error(val message: String) : UiState
}

sealed interface UiEvent {
    data class ShowToast(val message: String) : UiEvent
    data class NavigateToDetails(val id: String) : UiEvent
}

class DashboardViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    private val _eventChannel = Channel<UiEvent>(Channel.BUFFERED)
    val events: Flow<UiEvent> = _eventChannel.receiveAsFlow()

    fun loadData() {
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            try {
                val data = listOf("Alpha", "Beta", "Gamma")
                _uiState.value = UiState.Success(data)
                _eventChannel.send(UiEvent.ShowToast("Data loaded successfully"))
            } catch (e: Exception) {
                _uiState.value = UiState.Error(e.localizedMessage ?: "Unknown Error")
            }
        }
    }
}
```

---

## 3. Jetpack Compose Declarative UI Best Practices

- **Stable Types & Recomposition Skipping**: Annotate external or multiplatform data models with `@Immutable` or `@Stable` to allow Compose to skip unnecessary recompositions.
- **State Hoisting**: Keep Composables stateless by hoisting events up to callers and passing pure state down:

```kotlin
@Composable
fun MetricCard(
    title: String,
    value: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = title, style = MaterialTheme.typography.labelMedium)
            Text(text = value, style = MaterialTheme.typography.headlineMedium)
        }
    }
}
```

---

## 4. Kotlin Multiplatform (KMP) Architecture

Structure shared logic cleanly across targets (`androidMain`, `iosMain`, `commonMain`):
```kotlin
// commonMain
expect class PlatformEntropyGenerator() {
    fun generateSecureRandomBytes(length: Int): ByteArray
}

// iosMain
actual class PlatformEntropyGenerator actual constructor() {
    actual fun generateSecureRandomBytes(length: Int): ByteArray {
        // SecRandomCopyBytes implementation for iOS
        return ByteArray(length)
    }
}
```

---

## 5. Kotlin Engineering Checklist

- [ ] **K2 Compiler Verification**: Ensure `kotlin.experimental.tryK2=true` or Kotlin 2.0+ is enabled in `gradle.properties`.
- [ ] **Exhaustive When Statements**: Avoid generic `else` branches when checking sealed interfaces so compiler enforces new state additions.
- [ ] **Dispatcher Usage**: Never execute file/network I/O on `Dispatchers.Main`; use `withContext(Dispatchers.IO)`.
- [ ] **Flow Lifecycle Awareness**: In Android Compose, collect flows using `collectAsStateWithLifecycle()` to stop flow emissions when UI is in background.
