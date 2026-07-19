The derivative is usually introduced as a formula to compute. This lesson treats it as something to *see*: every function drags a shadow function along with it — its slope at every point — and once you can read that shadow, calculus stops being symbol-pushing.

## One number per point

At a single point, the derivative is the slope of the **tangent line** — the limit of secant slopes as the second point slides in:

$$
f'(x) \;=\; \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}
$$

(The [chain rule lesson](/lessons/gradients-chain-rule) builds this limit interactively, one secant at a time.)

But the derivative at *one* point is just a number. The real object is the function $x \mapsto f'(x)$: compute that slope at **every** point and plot the results. That plot has rules you can read at a glance:

- Where $f$ climbs, $f'$ is **positive**; where $f$ falls, $f'$ is **negative**.
- The **steeper** $f$, the **larger** $|f'|$ — $f'$ measures rate, not height.
- At every peak and valley of $f$, the tangent is flat: $f'$ **crosses zero**. This is why optimization is a hunt for zeros of the derivative — and why [gradient descent](/lessons/gradient-descent) stops moving where the gradient vanishes.

## Try it

Draw your own function on the upper graph — the derivative redraws itself live underneath. Hover to see the tangent line and watch its slope reappear as the height of the lower curve.

<demo name="derivative-grapher"></demo>

Worth trying:

- **sin x.** The derivative traced below is exactly $\cos x$ — shifted a quarter turn left. Hover along the curve and watch the tangent tilt in sync.
- **The cubic.** Two flat spots on $f$, two zero crossings on $f'$ — and between them $f'$ dips negative, exactly where the cubic descends.
- **Draw a straight line.** Constant slope: the derivative is a flat line at that slope. Zero stationary points, however wobbly your ruler hand.
- **Draw a W.** Three peaks and valleys → the derivative crosses zero three times.
- **Draw as fast and jaggedly as you can.** Small wiggles in $f$ become huge spikes in $f'$. Differentiation *amplifies* noise — the opposite of integration, which smooths it.

## The corner that breaks it

Load the **corner** preset, $f(x) = |x| - 1$. The derivative is $-1$ on the left and $+1$ on the right, and at $x = 0$ it *jumps* — no tangent line exists at a corner, so $f$ is not differentiable there.

Notice what the demo reports anyway: a marker at the corner, because the numerical derivative computes the slope there as $0$. Central differences average the two sides:

$$
\frac{f(0+h) - f(0-h)}{2h} \;=\; \frac{(h-1) - (h-1)}{2h} \;=\; 0
$$

The computer happily reports "flat" at the sharpest point on the curve. Numerical derivatives don't know when the true derivative fails to exist — a thing worth remembering every time you differentiate data instead of formulas. (Machine learning lives with this daily: ReLU, the most-used activation there is, has exactly this corner at zero — see [its derivative plotted](/lessons/gradients-chain-rule) — and frameworks just decree an answer for the corner point.)

## How the demo computes it

No symbols, no algebra — just the limit definition with a small, finite $h$, applied at every sample:

$$
f'(x) \;\approx\; \frac{f(x+h) - f(x-h)}{2h}
$$

Using points on *both* sides (a **central difference**) is more accurate than the one-sided version: its error shrinks like $h^2$ rather than $h$. In NumPy:

```python
import numpy as np

xs = np.linspace(-3, 3, 241)
f = np.sin(xs)                    # or any sampled/drawn values
h = xs[1] - xs[0]

fp = np.empty_like(f)
fp[1:-1] = (f[2:] - f[:-2]) / (2 * h)   # central differences
fp[0] = (f[1] - f[0]) / h               # one-sided at the ends
fp[-1] = (f[-1] - f[-2]) / h

np.allclose(fp, np.cos(xs), atol=h**2)  # True — error shrinks like h²
```

This isn't just a toy: finite differences are the standard *ground truth* for checking hand-derived gradients. This site's own test suite verifies the [backpropagation](/lessons/backpropagation) implementation by comparing every analytic gradient against exactly this formula.

## The takeaway

The derivative is a function, not a number — the original curve's slope, replayed point by point. Positive where it climbs, zero where it turns, jumping where it kinks. If you can sketch $f'$ from a picture of $f$ before computing anything, you understand differentiation; the algebra is just bookkeeping for what your eye already did.
