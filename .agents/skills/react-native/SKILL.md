---
name: react-native
description: Production React Native engineering. Covers the New Architecture (Fabric renderer, TurboModules, Bridgeless mode), Expo SDK 52+, Reanimated 3 worklets, Gesture Handler 2, native memory profiling, and offline-first state synchronization.
---

# React Native & Expo New Architecture Engineering

This skill provides comprehensive instructions for engineering high-performance, crash-resilient mobile applications using React Native's New Architecture (Fabric, TurboModules, Bridgeless Mode) and modern Expo workflows.

---

## 1. New Architecture Mechanics: Fabric & TurboModules

### Architecture Shift from Legacy Bridge
- **Legacy Bridge (Deprecated)**: Asynchronous, serialized JSON messaging over a single thread. Suffered from frame drops, layout latency, and queue congestion.
- **Fabric Renderer**: Direct C++ JSI (JavaScript Interface) bindings. UI operations execute synchronously or asynchronously with precise scheduling, zero JSON serialization, and multi-threaded rendering.
- **TurboModules**: Lazy-loaded native modules via JSI. Native methods are invoked synchronously as direct C++ function pointers.

### Codegen Specification Schema (TypeScript / Flow)
When authoring custom native modules for the New Architecture, specify interfaces via Codegen:

```typescript
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  multiply(a: number, b: number): Promise<number>;
  computeHashSync(payload: string): string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeCryptoBridge');
```

---

## 2. 60 FPS / 120 FPS Animations with Reanimated 3 & Worklets

### UI-Thread Worklets & Shared Values
All gesture-driven animations must execute directly on the UI thread via worklets to eliminate JS thread starvation:

```tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDecay,
} from 'react-native-reanimated';

export function InteractiveSwipeCard() {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      'worklet';
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      'worklet';
      if (Math.abs(event.velocityX) > 1000) {
        translateX.value = withDecay({ velocity: event.velocityX });
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 120 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 120 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotateZ: `${(translateX.value / 20).toFixed(2)}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, animatedStyle]} />
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 300,
    height: 400,
    backgroundColor: '#1e293b',
    borderRadius: 20,
  },
});
```

---

## 3. Native List Optimization & Memory Profiling

### Virtualization with `@shopify/flash-list`
Standard React Native `FlatList` suffers from blank spaces during rapid scrolling and high memory overhead. Always use `FlashList`:

```tsx
import React from 'react';
import { FlashList } from '@shopify/flash-list';
import { Text, View } from 'react-native';

interface TransactionItem {
  id: string;
  title: string;
  amount: number;
}

export function TransactionHistory({ items }: { items: TransactionItem[] }) {
  return (
    <FlashList
      data={items}
      renderItem={({ item }) => (
        <View style={{ height: 64, justifyContent: 'center', paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600' }}>{item.title}</Text>
          <Text style={{ color: '#64748b' }}>${item.amount.toFixed(2)}</Text>
        </View>
      )}
      estimatedItemSize={64}
      keyExtractor={(item) => item.id}
    />
  );
}
```

---

## 4. Offline-First Architecture & Secure Storage

### Secure Keychain Storage
Never store authentication tokens, private keys, or refresh tokens in `AsyncStorage` (unencrypted plaintext). Use `expo-secure-store` or `react-native-keychain`:

```typescript
import * as SecureStore from 'expo-secure-store';

export async function persistAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync('auth_access_token', token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function retrieveAuthToken(): Promise<string | null> {
  return await SecureStore.getItemAsync('auth_access_token');
}
```

---

## 5. React Native Engineering Checklist

- [ ] **New Architecture Enabled**: `newArchEnabled=true` in `android/gradle.properties` and CocoaPods flags.
- [ ] **No Inline Objects in Renders**: Memoize callbacks with `useCallback` and style arrays with `useMemo` or static `StyleSheet.create`.
- [ ] **Safe Area Handling**: Wrap root layouts with `SafeAreaProvider` and `useSafeAreaInsets()` from `react-native-safe-area-context`.
- [ ] **Image Optimization**: Use `expo-image` with aggressive caching and blurhash placeholders instead of basic `<Image />`.
- [ ] **Avoid Memory Leaks**: Clean up hardware back handlers, keyboard listeners, and WebSocket connections in `useEffect` return functions.
