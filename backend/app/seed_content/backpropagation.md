Gradient descent needs $\nabla L$ — the derivative of the loss with respect to *every* weight in the network. **Backpropagation** is the algorithm that computes all of them in one backward sweep, at roughly the cost of a single forward pass. It is the chain rule, organized well.

## Setup: the forward pass

Take a multilayer perceptron. Layer $\ell$ computes

$$
\mathbf{z}^{(\ell)} = W^{(\ell)} \mathbf{a}^{(\ell-1)} + \mathbf{b}^{(\ell)},
\qquad
\mathbf{a}^{(\ell)} = \sigma\!\left(\mathbf{z}^{(\ell)}\right)
$$

with $\mathbf{a}^{(0)} = \mathbf{x}$ (the input). The final activation is the prediction $p$, and a loss compares it to the target $y$ — for binary classification, the **cross-entropy**:

$$
L = -\bigl[\, y \log p + (1-y)\log(1-p) \,\bigr]
$$

During the forward pass we *cache* every $\mathbf{z}^{(\ell)}$ and $\mathbf{a}^{(\ell)}$. Backprop will need them.

## The key quantity: the layer error

Define the **error** of layer $\ell$ as the sensitivity of the loss to that layer's pre-activation:

$$
\boldsymbol{\delta}^{(\ell)} = \frac{\partial L}{\partial \mathbf{z}^{(\ell)}}
$$

Backprop rests on four equations:

**1. Output error.** For a sigmoid output with cross-entropy loss, a small miracle of algebra collapses the derivative to

$$
\boldsymbol{\delta}^{(\text{out})} = p - y
$$

*(prediction minus truth — the error signal is literally how wrong you were).*

**2. Error flows backward.** Each earlier layer's error comes from the next layer's, passed back through the weights and scaled by the local activation slope:

$$
\boldsymbol{\delta}^{(\ell)} = \left( W^{(\ell+1)\top} \boldsymbol{\delta}^{(\ell+1)} \right) \odot \sigma'\!\left(\mathbf{z}^{(\ell)}\right)
$$

This is the chain rule from the calculus lesson: sensitivities multiply along the chain, and $\odot$ (elementwise product) applies each neuron's own slope.

**3 & 4. Gradients from errors.** Once you have a layer's error, its weight and bias gradients are immediate:

$$
\frac{\partial L}{\partial W^{(\ell)}} = \boldsymbol{\delta}^{(\ell)} \, \mathbf{a}^{(\ell-1)\top},
\qquad
\frac{\partial L}{\partial \mathbf{b}^{(\ell)}} = \boldsymbol{\delta}^{(\ell)}
$$

Notice the recipe: **forward to compute and cache, backward to propagate $\boldsymbol{\delta}$, multiply cached activations by errors to get gradients.** One forward pass, one backward pass, every gradient in the network.

## Why this is a big deal

The naive alternative — nudge each weight, rerun the network, measure the loss change — costs one forward pass *per weight*. A million weights, a million forward passes, per training step. Backprop gets every gradient for the price of about *two* forward passes, no matter how many weights there are. This asymmetry (formally: *reverse-mode automatic differentiation*) is what makes training deep networks feasible at all.

It also explains **vanishing gradients** precisely: equation 2 multiplies by $\sigma'$ at every layer, so if those slopes are small (sigmoid's max is $0.25$), $\boldsymbol{\delta}$ shrinks exponentially as it travels backward.

## Watch it learn

This demo trains a real multilayer perceptron — implemented from scratch in NumPy on the server, using exactly the four equations above — on toy 2D datasets. The background color shows the network's predicted probability; the curve shows the cross-entropy loss falling as backprop + gradient descent do their work.

<demo name="neural-network"></demo>

Things worth trying:

- **Circles with 1 hidden layer of 8, tanh** — watch the boundary bend from a line into a ring.
- **XOR with hidden layer [2]** — two hidden neurons is the theoretical minimum; some random seeds solve it and some get stuck. Try a few seeds.
- **Spiral** — needs more capacity: try layers like [16, 16] and more epochs.
- **ReLU vs tanh** — ReLU boundaries are visibly *piecewise-linear* (straight facets); tanh boundaries are smooth.

## Key takeaways

- Backprop = chain rule + caching, organized as one backward sweep.
- The error signal starts as $p - y$ and flows backward through weights and activation slopes.
- Weight gradients are outer products of errors with cached activations.
- Its efficiency — all gradients for ~2× forward cost — is the foundation of deep learning.
