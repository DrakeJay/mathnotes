The other lessons in this topic explain how a neural network is trained. This one makes you do it — by hand, one weight at a time, against the clock of your own patience.

Below is a real neural network with real weights, scored by the real loss function. Your job is the optimizer's job: turn the knobs until the loss drops below **par**. Level 1 is easy. Level 3 is why gradient descent exists.

## How to play

- The dots are data: **blue** is class 1, **red** is class 0. The background shows what your network currently believes — $P(\text{blue})$ at every point of the plane.
- Every slider is one **parameter** of the network. Drag them and the background repaints instantly.
- Your score is the **cross-entropy loss** over all the points (lower is better):

$$
L \;=\; -\frac{1}{n}\sum_{i=1}^{n}\Big[\,t_i \ln p_i + (1-t_i)\ln(1-p_i)\,\Big]
$$

  where $t_i$ is the true label and $p_i$ is your network's probability for point $i$. A coin-flip network scores about $0.69$; a confident, correct one approaches $0$.

- **Beat par** — the loss a properly trained network reaches — and the level is solved.
- The small arrows beside each slider are hints. More on them below; they are the entire secret of deep learning.

<demo name="network-game"></demo>

## What you're actually driving

**Level 1** is a single neuron:

$$
p = \sigma(w_1 x + w_2 y + b)
$$

Three parameters. The equation $w_1 x + w_2 y + b = 0$ is a **line**, and the neuron says "blue on one side, red on the other" — softly, with $\sigma$ grading the transition. Two separated clusters just need the right line, and three knobs are few enough to find it by feel. (This is exactly the linear layer from [Vectors, Matrices, and Linear Layers](/lessons/vectors-matrices-linear-layers), plus a sigmoid.)

**Level 2** is the XOR pattern — blue in two opposite quadrants. No single line can separate it, which is the same limitation that makes [XOR interesting as a circuit](/lessons/logic-gates): it famously stalled neural-network research for a decade. The fix is a **hidden layer**:

$$
h_i = \tanh(w_{i1} x + w_{i2} y + b_i), \qquad
p = \sigma(v_1 h_1 + v_2 h_2 + c)
$$

Two hidden neurons — two lines — and an output neuron that combines them. That's 9 parameters, and they are **coupled**: rotate hidden neuron 1's line and the best settings for $v_1$, $v_2$, and $c$ all change too.

**Level 3** is a ring: blue inside, red outside. Three hidden neurons — three lines, bent through $\tanh$ and blended — can close a curved region. Thirteen parameters.

## Why your fingers give up

The loss is a single number that depends on every parameter at once: on level 3 it is a function

$$
L : \mathbb{R}^{13} \to \mathbb{R},
$$

a surface over a 13-dimensional space, and "solve the level" means "find a low point on it." A slider lets you walk along **one axis at a time**. You can't see the surface, every knob interacts with every other, and a promising direction on one slider silently ruins two others. Thirteen dimensions is already past what hands and eyes can search — and GPT-class models have around $10^{12}$ parameters. Same game, a trillion sliders.

## The cheat code you've been given

Those hint arrows are the **gradient**. Each arrow shows the sign of $-\partial L / \partial w$ for its slider: which way to drag *that* knob to lower the loss, holding the others still. Faint arrow, flat direction; solid arrow, steep one.

The **nudge** button moves every slider at once, each by a small step in its arrow's direction:

$$
\boldsymbol{\theta} \;\leftarrow\; \boldsymbol{\theta} - \eta\,\nabla L(\boldsymbol{\theta})
$$

That is one step of [gradient descent](/lessons/gradient-descent) — and pressing it repeatedly is the entire training algorithm. The reason it's practical is that all thirteen partial derivatives come out of **one** backward sweep through the network, at roughly the cost of two forward passes: that's [backpropagation](/lessons/backpropagation). The machine never sees the surface either. It just reads the arrows and steps — millions of times, in millions of dimensions.

## The whole game in NumPy

The demo's engine is small enough to read. Parameters live in one flat vector, exactly like the sliders:

```python
import numpy as np

def forward(params, X, hidden):
    """X: (n, 2) points. Returns P(blue) for each, plus hidden activations."""
    if hidden == 0:                                # level 1: a lone neuron
        w, b = params[:2], params[2]
        return 1 / (1 + np.exp(-(X @ w + b))), None
    W1 = params[:3 * hidden].reshape(hidden, 3)    # rows: [w_x, w_y, b]
    v, c = params[3 * hidden:-1], params[-1]
    H = np.tanh(X @ W1[:, :2].T + W1[:, 2])        # (n, hidden)
    return 1 / (1 + np.exp(-(H @ v + c))), H

def loss(p, t):                                    # the score you're beating
    p = np.clip(p, 1e-9, 1 - 1e-9)
    return -np.mean(t * np.log(p) + (1 - t) * np.log(1 - p))

def gradient(params, X, t, hidden):
    """The hint arrows: dL/dw for every slider, in one backward sweep."""
    p, H = forward(params, X, hidden)
    dz = (p - t) / len(t)                          # sigmoid + cross-entropy
    if hidden == 0:
        return np.concatenate([X.T @ dz, [dz.sum()]])
    W1 = params[:3 * hidden].reshape(hidden, 3)
    v = params[3 * hidden:-1]
    dA = np.outer(dz, v) * (1 - H**2)              # back through tanh
    dW1 = np.hstack([dA.T @ X, dA.sum(0, keepdims=True).T])
    return np.concatenate([dW1.ravel(), H.T @ dz, [dz.sum()]])

params = params - eta * gradient(params, X, t, hidden)   # the nudge button
```

The last line, in a loop, is what "training a neural network" means.

## The takeaway

Hand-tuning three knobs is a puzzle. Hand-tuning thirteen is torture, and hand-tuning a trillion is not a thing that can happen in this universe. The gradient converts an unsearchable space into a sequence of tiny, locally-obvious moves — and backpropagation makes computing it nearly free. Once you've lost level 3 honestly and then watched the nudge button win it, you know, in your hands, why this one idea carries all of deep learning.
