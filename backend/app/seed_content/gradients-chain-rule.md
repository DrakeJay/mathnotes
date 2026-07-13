Training a neural network means adjusting millions of numbers to make a loss smaller. The tool that makes this possible is the derivative — and one rule for combining derivatives, the chain rule, is the engine behind all of deep learning.

## The derivative measures sensitivity

The derivative of $f$ at a point tells you how much the output changes when you nudge the input:

$$
f'(x) = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h}
$$

Read $f'(x) = 3$ as: *"increase $x$ a tiny bit, and $f$ increases about 3 times as fast."* That's it. Everything else in this lesson is bookkeeping for functions with many inputs.

This "sensitivity" reading is the one that matters for machine learning, because it answers the question we actually care about: *if I tweak this weight, does the loss go up or down, and by how much?*

You can watch the definition happen. The secant line through $(a, f(a))$ and $(a+h, f(a+h))$ has slope exactly $\frac{f(a+h)-f(a)}{h}$ — shrink $h$ toward zero and it collapses onto the tangent:

<demo name="tangent-line"></demo>

## Many inputs: partial derivatives and the gradient

A loss function doesn't have one input — it has one input **per weight**. For $f(x, y)$, the **partial derivative** $\frac{\partial f}{\partial x}$ asks the same sensitivity question while holding $y$ frozen.

Collect all the partials into a vector and you get the **gradient**:

$$
\nabla f = \begin{bmatrix} \dfrac{\partial f}{\partial x} \\[1ex] \dfrac{\partial f}{\partial y} \end{bmatrix}
$$

The gradient has a famous geometric property: **it points in the direction of steepest ascent**, and its length says how steep that ascent is. Walk *against* the gradient and you descend as fast as locally possible — the next lesson is entirely about exploiting this.

For example, for $f(x,y) = x^2 + 3y^2$:

$$
\nabla f = \begin{bmatrix} 2x \\ 6y \end{bmatrix}
$$

At the point $(1, 1)$ the surface is three times more sensitive to $y$ than to $x$.

## The chain rule: sensitivities multiply

Neural networks are *compositions* — the output of one layer feeds the next. If $y = f(u)$ and $u = g(x)$, the chain rule says:

$$
\frac{dy}{dx} = \frac{dy}{du} \cdot \frac{du}{dx}
$$

The intuition is almost mechanical: if $u$ is 2× as sensitive to $x$, and $y$ is 5× as sensitive to $u$, then $y$ is 10× as sensitive to $x$. **Sensitivities along a chain multiply.**

For a deep network, the loss depends on an early weight through a long chain:

$$
\frac{\partial L}{\partial w} =
\frac{\partial L}{\partial a^{(3)}} \cdot
\frac{\partial a^{(3)}}{\partial a^{(2)}} \cdot
\frac{\partial a^{(2)}}{\partial a^{(1)}} \cdot
\frac{\partial a^{(1)}}{\partial w}
$$

Backpropagation (two lessons from now) is nothing more than evaluating these products efficiently, reusing shared factors instead of recomputing them.

## Activation functions and their derivatives

The nonlinearities between layers need derivatives too, since they sit inside the chain. The three classics:

| Function | Formula | Derivative |
| --- | --- | --- |
| Sigmoid | $\sigma(z) = \dfrac{1}{1 + e^{-z}}$ | $\sigma(z)\,(1 - \sigma(z))$ |
| Tanh | $\tanh(z)$ | $1 - \tanh^2(z)$ |
| ReLU | $\max(0, z)$ | $1$ if $z > 0$, else $0$ |

Explore them and their derivatives below:

<demo name="activation-functions"></demo>

## Why the derivative shapes matter: vanishing gradients

Look at the sigmoid's derivative: it peaks at just $0.25$ and collapses toward $0$ for large $|z|$. In a chain of many layers, the chain rule *multiplies* these factors — and $0.25^{10} \approx 10^{-6}$. Gradients shrink exponentially with depth, and early layers stop learning. This is the **vanishing gradient problem**, and it's the main reason modern networks favor ReLU, whose derivative is exactly $1$ on the active side.

This isn't hypothetical — the demo below builds a deep network, runs one backward pass (real NumPy on the server), and measures the average gradient magnitude at every layer. The y-axis is $\log_{10}$: each unit down is 10× smaller. Increase the depth and watch sigmoid's early layers starve while ReLU's stay healthy:

<demo name="vanishing-gradients"></demo>

## Key takeaways

- A derivative is a sensitivity: how much the output moves per nudge of the input.
- The gradient collects all partial sensitivities and points uphill; $-\nabla f$ points downhill.
- Chain rule: sensitivities through composed functions multiply.
- Activation derivatives sit inside every chain — their shape (e.g. sigmoid's tiny peak) has architecture-level consequences.
