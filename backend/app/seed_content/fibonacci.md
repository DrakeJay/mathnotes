You have already met this sequence twice on this site without being introduced. It made the [Euclidean algorithm](/lessons/euclidean-algorithm) as slow as possible — drawing a golden spiral of squares in the process — and it made the [call-stack demo](/lessons/stack-in-memory) waste work recomputing the same values. Time to meet it properly.

## The sequence

Start with $0$ and $1$; every number after is the sum of the previous two:

$$
F_0 = 0,\quad F_1 = 1,\qquad F_n = F_{n-1} + F_{n-2}
$$

$$
0,\; 1,\; 1,\; 2,\; 3,\; 5,\; 8,\; 13,\; 21,\; 34,\; 55,\; 89,\; 144,\; \dots
$$

Fibonacci posed it in 1202 as a puzzle about breeding rabbits, but the recurrence is the real star: it is the simplest rule that makes the present depend on *two* steps of the past, and it shows up wherever growth compounds — branching plants, sunflower spirals, and (as you'll see) the running time of naive recursion.

## The golden ratio hides inside

Divide consecutive terms and watch:

$$
\tfrac{3}{2} = 1.5,\quad
\tfrac{5}{3} = 1.667,\quad
\tfrac{8}{5} = 1.6,\quad
\tfrac{13}{8} = 1.625,\quad
\tfrac{21}{13} = 1.6154,\;\dots
$$

The ratios close in — alternating above and below — on the **golden ratio**:

$$
\varphi = \frac{1 + \sqrt 5}{2} \approx 1.6180339\ldots
$$

Why $\varphi$? If the ratio settles to some $x$, then dividing the recurrence by $F_{n-1}$ gives $x = 1 + \tfrac 1x$, i.e. $x^2 = x + 1$ — and $\varphi$ is the positive root. Better still, there is an exact closed form, **Binet's formula**:

$$
F_n = \frac{\varphi^n - \psi^n}{\sqrt 5},
\qquad \psi = \frac{1 - \sqrt 5}{2} \approx -0.618
$$

Since $|\psi| < 1$, the $\psi^n$ term dies out and $F_n$ is just $\varphi^n/\sqrt 5$ rounded to the nearest integer. Fibonacci numbers grow **exponentially**, with $\varphi$ as the base — which is exactly why they're the Euclidean algorithm's worst case: the slowest-shrinking inputs are the ones built from the recurrence itself.

## The wrong way to compute it

Translate the definition straight into code — `fib(n) = fib(n-1) + fib(n-2)` — and you get a tree of calls that computes the same values over and over. How bad is it? The call count obeys the *same recurrence* it computes, so the work grows like $\varphi^n$: computing $F_{50}$ this way takes tens of billions of calls.

## Try it

Draw the tree and see the waste — every red node is a value that was already computed. Then flip the memoize switch:

<demo name="fibonacci"></demo>

Things worth trying:

- Slide $n$ up and watch the red fraction take over the tree — the waste *is* the exponential.
- Toggle **memoize**: repeats collapse into cache hits, and the count drops from $\sim \varphi^n$ to $n+1$ computations.
- Check the ratio chart: the bars of the oscillation around $\varphi$ shrink geometrically (that's $\psi^n$ dying).

## The right ways to compute it

**Memoization** — cache every result the first time; every later request is a lookup. The tree collapses to $n+1$ real computations. This is your first taste of **dynamic programming**: when a problem has *overlapping subproblems*, store, don't recompute.

**Iteration** — even simpler: keep the last two values, loop $n$ times. $O(n)$ time, $O(1)$ memory, no [call-stack](/lessons/stack-in-memory) depth at all.

**Fast doubling** — for the truly greedy, identities like $F_{2k} = F_k(2F_{k+1} - F_k)$ compute $F_n$ in $O(\log n)$ steps by halving $n$ — the same divide-the-problem spirit as [binary search](/lessons/search-algorithms).

The sequence didn't change; the *algorithm* did — from $\varphi^n$ to $n$ to $\log n$. Few examples show more vividly that how you compute matters as much as what.

## A pocketful of identities

The recurrence breeds patterns. Two favorites:

$$
F_1 + F_2 + \cdots + F_n = F_{n+2} - 1
\qquad\qquad
F_{n-1}F_{n+1} - F_n^2 = (-1)^n \;\;\text{(Cassini)}
$$

Cassini's identity is the secret behind a classic "cut a square, rearrange it, gain a unit of area" magic trick — the missing area is exactly that $(-1)^n$.

## Key takeaways

- $F_n = F_{n-1} + F_{n-2}$: the simplest two-step recurrence, growing like $\varphi^n/\sqrt5$ (Binet).
- Consecutive ratios converge to the golden ratio, oscillating as $\psi^n$ fades.
- Naive recursion recomputes exponentially; memoization (dynamic programming) makes it linear; fast doubling makes it logarithmic.
- One sequence ties together Euclid's worst case, golden spirals, call stacks, and the birth of dynamic programming.
