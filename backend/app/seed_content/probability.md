You have been using probability distributions on this site for a while now — [softmax](/lessons/softmax-cross-entropy) outputs are one, attention weights are one, cross-entropy measured your surprise at one. This lesson goes back to the beginning: what probability *is*, what the law of large numbers actually promises, and how a bell curve assembles itself out of coin flips.

## What the number means

A probability is a number between $0$ and $1$ attached to an outcome, and the working interpretation is **long-run frequency**: saying a fair coin lands heads with probability $\tfrac12$ means that as you flip more and more, the *fraction* of heads approaches $\tfrac12$. The bookkeeping rules are minimal:

- every outcome gets $P \ge 0$,
- over all possible outcomes, the probabilities **sum to 1** (something must happen),
- for events that can't co-occur, probabilities add.

A full assignment of probabilities to outcomes is a **distribution** — the same object the softmax produced from logits.

When outcomes are symmetric, counting does the work: a fair die gives each face $\tfrac16$; the chance of rolling an even number is $\tfrac{3}{6} = \tfrac12$.

## Independence

Two events are **independent** when knowing one tells you nothing about the other; then probabilities *multiply*:

$$
P(A \text{ and } B) = P(A)\,P(B)
$$

Two dice both showing six: $\tfrac16 \cdot \tfrac16 = \tfrac1{36}$. Independence is the workhorse assumption of this whole lesson — each coin flip neither remembers nor cares about the last.

## The law of large numbers

Flip a coin with heads-probability $p$, over and over. The **law of large numbers** says the observed fraction of heads converges to $p$:

$$
\frac{\#\text{heads}}{n} \;\longrightarrow\; p \qquad \text{as } n \to \infty
$$

Watch it happen — and watch *how* it happens:

<demo name="coin-flips"></demo>

Things worth trying:

- Flip 1 at a time first: the early proportion swings wildly — small samples lie.
- Then add 5,000: the blue line pins itself to the true $p$ line.
- Set $p = 0.7$ and confirm the law doesn't care about fairness — it converges to whatever $p$ is.
- **Watch the excess readout.** The *count* of heads doesn't home in on $p \cdot n$ — its distance from it typically *grows*, like $\sqrt{n}$. The proportion converges only because $\sqrt n / n \to 0$.

That last point kills the **gambler's fallacy**. After a run of tails, the coin owes you nothing: chance doesn't *compensate* for an imbalance, it *dilutes* it under an ever-larger denominator.

## Counting heads: the binomial distribution

Fix $n$ flips and ask: how many heads? Each particular sequence with $k$ heads has probability $p^k(1-p)^{n-k}$, and there are $\binom{n}{k}$ such sequences (Pascal's triangle makes its entrance), so

$$
P(k \text{ heads}) = \binom{n}{k} p^k (1-p)^{n-k}
$$

This is the **binomial distribution** — and there is a machine that draws it. A Galton board drops balls through rows of pegs; at each peg the ball bounces left or right with probability $\tfrac12$. A ball's final bin is just its number of right-bounces: $n$ independent coin flips, embodied.

<demo name="galton-board"></demo>

Things worth trying:

- Drop balls **one at a time** and watch a single random path — pure coin flips.
- Drop 5,000 and compare the histogram to the yellow theoretical dots — the binomial, empirically.
- Squint at the silhouette: that symmetric mound is the **bell curve** emerging. The fact that sums of many independent random choices always trend toward that shape is the *central limit theorem* — the most important fact in statistics, and a lesson of its own someday.

## Why machine learning is soaked in this

Training data is a sample; a loss is an average — an *empirical expectation* standing in for a true one, justified by exactly the law of large numbers you just watched. SGD's minibatch gradients are noisy estimates that average out for the same reason. And when an LLM samples its next token from a softmax at some temperature, it is drawing from precisely the kind of distribution this lesson began with. Probability isn't adjacent to machine learning — it's the ground it stands on.

## Key takeaways

- A distribution assigns non-negative numbers summing to $1$; probability = long-run frequency.
- Independent events multiply; each flip is memoryless.
- Law of large numbers: the *proportion* converges to $p$ — while the raw excess wanders like $\sqrt n$. No compensation, only dilution.
- Counts of independent successes follow the binomial $\binom{n}{k}p^k(1-p)^{n-k}$, whose silhouette is already the bell curve.
