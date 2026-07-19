We know from the last lesson that the gradient $\nabla L$ points uphill on the loss surface. Training a network is then conceptually one line: *take small steps downhill until you can't descend anymore.*

## The update rule

Gradient descent repeats a single update:

$$
\boldsymbol{\theta} \;\leftarrow\; \boldsymbol{\theta} - \eta \, \nabla L(\boldsymbol{\theta})
$$

where $\boldsymbol{\theta}$ is the vector of **all** parameters (weights and biases) and $\eta$ (eta) is the **learning rate** — the single most important hyperparameter in deep learning.

That's the whole algorithm — small enough to write out completely:

```python
import numpy as np

def grad(x, y):                       # gradient of L = 0.5·x² + 1.5·y²
    return np.array([x, 3 * y])

theta = np.array([-3.4, 2.6])         # start somewhere on the surface
lr = 0.1                              # the learning rate η

for _ in range(60):
    theta = theta - lr * grad(*theta) # step downhill
```

The demo below runs literally this loop on the server ([see the source](https://github.com/DrakeJay/mathnotes/blob/main/backend/app/routers/ml.py)). Everything interesting is in how it *behaves*.

## Try it

The demo below runs real gradient descent (computed on the server with NumPy) on three loss surfaces. The heatmap shows the loss; the dots are the optimizer's steps.

<demo name="gradient-descent"></demo>

Things worth trying:

- **Bowl, $\eta = 0.1$** — smooth convergence to the minimum.
- **Bowl, $\eta = 0.65$** — the surface curves 3× more steeply in $y$ than $x$, so steps *overshoot* across the valley and zig-zag. Push $\eta$ just above $2/3$ and it diverges outright.
- **Saddle** — the origin is a *saddle point*: flat, gradient near zero, but not a minimum. Descent crawls near it, then escapes along the downhill direction. High-dimensional loss surfaces are full of these.
- **Rosenbrock** — the infamous "banana valley." Reaching the valley floor is easy; traveling along the curved, nearly-flat floor to the true minimum at $(1,1)$ takes thousands of tiny steps. Try $\eta = 0.001$ vs $0.003$.

## The learning rate dilemma

The zig-zag you saw in the elongated bowl is the fundamental tension:

- $\eta$ **too small** → convergence takes forever.
- $\eta$ **too large** → steps overshoot the minimum; oscillation or divergence.
- The tolerable range is set by the **curvature** of the surface — and when curvature differs by direction (an *ill-conditioned* problem), no single $\eta$ is good for both directions at once.

Formally, for a quadratic bowl $L = \tfrac{1}{2}(\lambda_1 x^2 + \lambda_2 y^2)$, gradient descent converges only if $\eta < 2/\lambda_{\max}$, but the speed along the shallow direction is governed by $\lambda_{\min}$. The ratio $\lambda_{\max}/\lambda_{\min}$ (the *condition number*) controls how painful the zig-zagging is.

## Variants used in practice

- **Stochastic gradient descent (SGD).** Computing $\nabla L$ over millions of examples per step is wasteful. SGD estimates the gradient from a small random *mini-batch*. The steps are noisy but far cheaper, and the noise even helps escape saddle points.
- **Momentum.** Keep a running average of past gradients: $\mathbf{v} \leftarrow \beta\mathbf{v} + \nabla L$, then step along $\mathbf{v}$. Oscillating directions cancel; consistent directions accumulate — exactly what the zig-zagging bowl needs.
- **Adam.** Combines momentum with a per-parameter adaptive learning rate. The default optimizer for most deep learning today.

Watch momentum earn its keep. Same surface, same start, same learning rate: on the Rosenbrock valley, plain descent reaches the valley floor and then crawls, while momentum accumulates velocity along the flat direction and travels roughly 100× further toward the minimum:

<demo name="momentum"></demo>

Also try lowering $\beta$ to $0$ (which recovers plain descent — the two paths coincide), and pushing $\beta$ toward $0.99$, where the "heavy ball" overshoots and spirals. Momentum has its own stability limits.

All of them keep the same skeleton: *step opposite to (some estimate of) the gradient.*

## Key takeaways

- Gradient descent: $\boldsymbol{\theta} \leftarrow \boldsymbol{\theta} - \eta \nabla L$, repeated.
- The learning rate trades speed against stability, and curvature sets the limits.
- Real loss surfaces have saddles and curved valleys, not just clean bowls.
- SGD, momentum, and Adam are refinements of the same downhill idea.
