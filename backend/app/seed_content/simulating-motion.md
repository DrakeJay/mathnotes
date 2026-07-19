Newton's second law fits in five characters — $F = ma$ — but it hides a differential equation: acceleration is the [derivative](/lessons/gradients-chain-rule) of velocity, which is the derivative of position. For a handful of textbook cases that equation solves in closed form. For everything else — drag, orbits, game physics, molecules — we *simulate*: chop time into slices and march forward. This lesson is about that march, and about the two-line decision that determines whether your simulated solar system survives.

## The law, read as instructions

$F = ma$ rearranges into an update recipe. Acceleration tells velocity how to change; velocity tells position how to change:

$$
a = \frac{F(x, v)}{m}, \qquad
\frac{dv}{dt} = a, \qquad
\frac{dx}{dt} = v
$$

**Euler's method** replaces the infinitesimal $dt$ with a small but finite step — physics in four lines:

```python
dt = 0.001
while t < t_end:
    a = force(x, v) / m     # Newton: F = ma
    v = v + a * dt          # velocity follows acceleration
    x = x + v * dt          # position follows velocity
    t = t + dt
```

If that loop shape looks familiar, it should: [gradient descent](/lessons/gradient-descent) — $\theta \leftarrow \theta - \eta\,\nabla L$ — is *exactly* Euler's method, integrating a particle that flows downhill on the loss surface. Training a neural network is a physics simulation where the landscape is the loss.

## Projectiles: where the closed form ends

With gravity alone, the equation surrenders: constant $a = -g$ integrates twice into the parabola

$$
x(t) = v_0 \cos\theta \, t, \qquad
y(t) = v_0 \sin\theta \, t - \tfrac{1}{2} g t^2,
$$

with range $R = \tfrac{v_0^2 \sin 2\theta}{g}$ — maximized at $\theta = 45°$. But add **air drag**, a force $-k\,\lVert v\rVert\,v$ that pushes against motion and grows with speed squared, and no closed form exists. The simulation loop doesn't care: drag is just one more term in `force`.

<demo name="projectile-sim"></demo>

Things worth trying:

- With drag at zero, confirm the classics: $45°$ beats $40°$ and $50°$; doubling speed quadruples range.
- Raise the drag and watch the trajectory pull inside the gray no-drag parabola — steep at the end, like a real ball, and the best angle drops *below* $45°$.
- The simulated no-drag range matches the formula to a fraction of a meter — the discretization error of a small $dt$.

## Orbits: where Euler betrays you

Point gravity at a star — $a = -GM\,\hat r / r^2$ — and simulate an orbit. Naive Euler does something alarming: **the planet spirals outward**, gaining energy from nowhere. No bug; the method itself injects energy every step, because each position update uses a velocity that's about to be stale.

The repair costs nothing. Update velocity *first*, then move with the **new** velocity:

```python
# naive Euler — position steps with the OLD velocity; energy drifts up
a = accel(x)
x = x + v * dt
v = v + a * dt

# semi-implicit (symplectic) Euler — v first, then move with the NEW v
a = accel(x)
v = v + a * dt
x = x + v * dt      # orbits now stay closed, forever
```

Same arithmetic, same cost, opposite fates. The second version is **symplectic** — it respects the geometry of energy conservation, so errors circulate instead of accumulating. Watch the difference:

<demo name="orbit-sim"></demo>

Things worth trying:

- Run **naive Euler** and watch the trail spiral out while the energy readout climbs toward zero (escape).
- Switch to **symplectic** with the same $dt$: the orbit closes and the energy just breathes around its true value.
- Crank $dt$ up: symplectic wobbles but survives; Euler's doom merely arrives faster.

## Why this matters beyond planets

Every game engine's physics step, every molecular-dynamics run, every orbital mechanics package lives on this choice: integrators that conserve the right quantities can take big steps for millions of iterations, while naive ones quietly cook their systems. It is the numerical version of a lesson this site keeps finding: *how* you compute is as consequential as *what* you compute — the [same sequence, different algorithm](/lessons/fibonacci) story, now with planets at stake.

## Key takeaways

- $F = ma$ is a differential equation; simulation integrates it step by step — four lines of code.
- Gradient descent is Euler's method on a loss landscape: ML training *is* a physics simulation.
- Drag breaks the closed form; simulation doesn't notice — that's why it runs the world's physics.
- Update order matters: symplectic Euler (v first) conserves energy in the long run; naive Euler drifts. Two lines, opposite destinies.
