---
name: physics
description: Master-level computational and theoretical physics engineering. Covers numerical differential equation solvers (Verlet, Runge-Kutta 4th order), classical Lagrangian/Hamiltonian mechanics, orbital mechanics, thermodynamics, and wave equations.
---

# Computational Physics & Physical Systems Simulation

This skill provides exhaustive mathematical and programmatic guidance on simulating physical systems, solving differential equations, and modeling dynamical physical phenomena.

---

## 1. Numerical Integration & Solvers for Ordinary Differential Equations (ODEs)

### Fourth-Order Runge-Kutta (RK4)
For a system of first-order ODEs $\frac{d\vec{y}}{dt} = \vec{f}(t, \vec{y})$, RK4 achieves local truncation error $O(\Delta t^5)$ and global error $O(\Delta t^4)$:

$$\vec{k}_1 = \vec{f}(t_n, \vec{y}_n)$$
$$\vec{k}_2 = \vec{f}\left(t_n + \frac{\Delta t}{2}, \vec{y}_n + \frac{\Delta t}{2}\vec{k}_1\right)$$
$$\vec{k}_3 = \vec{f}\left(t_n + \frac{\Delta t}{2}, \vec{y}_n + \frac{\Delta t}{2}\vec{k}_2\right)$$
$$\vec{k}_4 = \vec{f}(t_n + \Delta t, \vec{y}_n + \Delta t \vec{k}_3)$$
$$\vec{y}_{n+1} = \vec{y}_n + \frac{\Delta t}{6}\left(\vec{k}_1 + 2\vec{k}_2 + 2\vec{k}_3 + \vec{k}_4\right)$$

### Velocity Verlet (Symplectic Integrator for Hamiltonian Systems)
RK4 is dissipative over long integration horizons and does not conserve phase space volume or total energy. For conservative orbital and molecular dynamics, **always use symplectic integrators like Velocity Verlet**:

$$\vec{x}(t + \Delta t) = \vec{x}(t) + \vec{v}(t)\Delta t + \frac{1}{2}\vec{a}(t)\Delta t^2$$
$$\vec{a}(t + \Delta t) = \frac{\vec{F}(\vec{x}(t + \Delta t))}{m}$$
$$\vec{v}(t + \Delta t) = \vec{v}(t) + \frac{1}{2}\left[\vec{a}(t) + \vec{a}(t + \Delta t)\right]\Delta t$$

#### Python Velocity Verlet Implementation:
```python
import numpy as np

def velocity_verlet_step(x: np.ndarray, v: np.ndarray, dt: float, accel_func) -> tuple[np.ndarray, np.ndarray]:
    a_current = accel_func(x)
    x_next = x + v * dt + 0.5 * a_current * (dt ** 2)
    a_next = accel_func(x_next)
    v_next = v + 0.5 * (a_current + a_next) * dt
    return x_next, v_next
```

---

## 2. Classical Mechanics: Lagrangian & Hamiltonian Formalisms

### Euler-Lagrange Equations
For generalized coordinates $q_i$ and velocities $\dot{q}_i$, define the Lagrangian $L(q, \dot{q}, t) = T - V$ (Kinetic minus Potential Energy):

$$\frac{d}{dt}\left(\frac{\partial L}{\partial \dot{q}_i}\right) - \frac{\partial L}{\partial q_i} = 0$$

### Hamiltonian Phase Space Dynamics
Using generalized momentum $p_i = \frac{\partial L}{\partial \dot{q}_i}$ and Hamiltonian $H(q, p) = \sum p_i \dot{q}_i - L$:

$$\dot{q}_i = \frac{\partial H}{\partial p_i}, \quad \dot{p}_i = -\frac{\partial H}{\partial q_i}$$

Liouville's theorem proves that phase space volume is strictly conserved: $\frac{d\rho}{dt} = 0$.

---

## 3. Orbital Mechanics & Gravitational N-Body Simulation

Newton's Law of Universal Gravitation for body $i$ due to all bodies $j \ne i$:

$$\vec{a}_i = -G \sum_{j \ne i} \frac{m_j (\vec{r}_i - \vec{r}_j)}{\left(\|\vec{r}_i - \vec{r}_j\|^2 + \epsilon^2\right)^{3/2}}$$

Where $\epsilon$ is the gravitational softening length to prevent numerical division-by-zero singularities during close encounters.

---

## 4. Physics Simulation Checklist

- [ ] **Energy Conservation Monitoring**: Track total energy $E(t) = T(t) + V(t)$; verify $\frac{|E(t) - E(0)|}{|E(0)|} < 10^{-4}$ throughout simulation runtime.
- [ ] **Symplectic Preservation**: Use symplectic algorithms (Verlet / Leapfrog) for undamped physical motion.
- [ ] **Courant-Friedrichs-Lewy (CFL) Condition**: In wave and fluid PDEs, ensure time step $\Delta t \le C \frac{\Delta x}{v_{\max}}$ where $C \le 1.0$ to guarantee numerical stability.
