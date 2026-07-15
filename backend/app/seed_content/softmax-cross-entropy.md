The backpropagation lesson trained a network to answer a yes/no question with a single sigmoid output. Real classifiers usually choose among *many* classes — is this digit a 0, 1, …, or 9? That takes two pieces of math: **softmax** to turn raw scores into a probability distribution, and **cross-entropy** to score that distribution against the truth.

## From scores to probabilities

A network's last linear layer produces one raw score per class, called **logits**: $\mathbf{z} = (z_1, \dots, z_K)$. Logits can be any real numbers. Probabilities can't — they must be non-negative and sum to $1$. Softmax converts one into the other:

$$
\operatorname{softmax}(\mathbf{z})_i \;=\; \frac{e^{z_i}}{\sum_{j=1}^{K} e^{z_j}}
$$

Why $e^{z}$ and not something simpler?

1. **It's always positive**, so every class gets probability greater than zero.
2. **It preserves order** — a bigger logit always means a bigger probability.
3. **It's smooth**, so gradients flow through it (the whole point, by now).
4. **It amplifies differences.** A logit lead of $2$ becomes a probability ratio of $e^2 \approx 7.4$. Softmax is *soft* — it never fully commits — but it leans hard toward the winner.

## Properties worth knowing

**Shifting all logits does nothing.** Adding a constant $c$ to every $z_i$ multiplies the top and bottom of the fraction by $e^c$, which cancels:

$$
\operatorname{softmax}(\mathbf{z} + c) = \operatorname{softmax}(\mathbf{z})
$$

Only *differences between logits* matter. (Implementations exploit this: subtracting $\max_j z_j$ from every logit before exponentiating prevents $e^{z}$ from overflowing. Same math, stable numbers.)

**Two classes collapse to the sigmoid.** With $K = 2$,

$$
\operatorname{softmax}(\mathbf{z})_1 = \frac{e^{z_1}}{e^{z_1} + e^{z_0}} = \frac{1}{1 + e^{-(z_1 - z_0)}} = \sigma(z_1 - z_0)
$$

— the sigmoid from earlier lessons, applied to the score *difference*. Everything you learned about binary classification is the $K=2$ special case.

**Temperature controls the sharpness.** Divide the logits by a temperature $T$ before the softmax:

$$
p_i \;=\; \frac{e^{z_i / T}}{\sum_j e^{z_j / T}}
$$

As $T \to 0$ the distribution collapses onto the argmax (one class gets everything); as $T \to \infty$ it flattens toward uniform. This is exactly the **temperature** setting you see on language-model APIs — sampling from a sharpened or flattened softmax over next tokens.

## Try it

Drag the logits and the temperature; click a bar to choose which class is the *true* one and watch the cross-entropy respond:

<demo name="softmax"></demo>

Things worth trying:

- Set all logits equal — probabilities go uniform, and the loss is $\ln 4 \approx 1.39$ no matter which class is true.
- Give the true class a big lead, then **drop the temperature** — the loss falls toward $0$.
- Make the network *confidently wrong*: true class at $z=-4$, another at $z=+4$. Watch the loss explode — that's the property that makes training work.
- Raise the temperature on any configuration — every distribution drifts toward uniform.

## Cross-entropy: scoring a probabilistic guess

The truth is a **one-hot** vector $\mathbf{y}$ — a $1$ for the correct class, $0$ elsewhere. Cross-entropy compares the predicted distribution to it:

$$
L \;=\; -\sum_{i=1}^{K} y_i \log p_i \;=\; -\log p_{\text{true}}
$$

Read it as: *the loss is how surprised you are by the correct answer.*

- Certain and right ($p_{\text{true}} \to 1$): loss $\to 0$.
- Certain and wrong ($p_{\text{true}} \to 0$): loss $\to \infty$.

That asymmetry is deliberate. A model that is hesitantly wrong pays a modest price; a model that is *confidently* wrong pays an enormous one. This is also just **maximum likelihood** in disguise: minimizing cross-entropy over a dataset is exactly maximizing the probability the model assigns to the true labels.

## The gradient is (p − y), again

In the backpropagation lesson, sigmoid + binary cross-entropy produced the startlingly clean output error $\delta = p - y$. The multi-class pairing produces the same miracle. Chain the cross-entropy through the softmax and everything telescopes:

$$
\frac{\partial L}{\partial z_i} \;=\; p_i - y_i
$$

The gradient of the loss with respect to each logit is just *predicted probability minus truth* — a vector pointing from the answer toward the guess. No vanishing factors, no saturation terms: even when the softmax is badly saturated and confidently wrong, the gradient stays large exactly when the error is large. This clean pairing is why softmax + cross-entropy is the default output layer for classification, and it's the multi-class version of the $\delta^{(\text{out})} = p - y$ you already met.

## Key takeaways

- Softmax turns arbitrary logits into a probability distribution; only logit *differences* matter.
- Temperature reshapes the distribution: low $T$ → argmax, high $T$ → uniform — the same dial as LLM sampling temperature.
- Cross-entropy $= -\log p_{\text{true}}$: the surprise at the right answer, brutal on confident mistakes, and secretly maximum likelihood.
- Softmax + cross-entropy gives the clean gradient $p - y$, generalizing the binary case.
