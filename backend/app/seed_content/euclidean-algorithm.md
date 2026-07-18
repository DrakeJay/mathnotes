Open Euclid's *Elements*, written around 300 BC, and in Book VII you'll find a procedure that still runs, unchanged, billions of times a day inside cryptographic libraries. It computes the **greatest common divisor** — and it's the oldest algorithm still in serious use.

## The problem

The **gcd** of two positive integers is the largest integer dividing both:

$$
\gcd(252, 105) = 21
$$

You need it to put fractions in lowest terms, to reason about divisibility — and, it turns out, to build modern cryptography.

The naive approach (list all divisors of both, take the largest) is hopeless for big numbers. Euclid found something better.

## The one insight

Divide $a$ by $b$: $a = qb + r$ with remainder $0 \le r < b$. Then:

$$
\gcd(a, b) = \gcd(b, r)
$$

**Why:** any number dividing both $a$ and $b$ also divides $a - qb = r$. And any number dividing both $b$ and $r$ also divides $qb + r = a$. So the pairs $(a, b)$ and $(b, r)$ have *exactly the same common divisors* — hence the same greatest one. The problem shrinks and nothing is lost.

Repeat until the remainder hits $0$; the last nonzero remainder is the gcd:

$$
\begin{aligned}
252 &= 2 \cdot 105 + 42\\
105 &= 2 \cdot 42 + 21\\
42 &= 2 \cdot 21 + \mathbf{0}
\end{aligned}
\qquad \Longrightarrow \qquad \gcd(252, 105) = 21
$$

## The algorithm is a picture

Here is the same computation as geometry. Take a $252 \times 105$ rectangle and repeatedly slice off the **largest square that fits**. Each division step $a = qb + r$ slices $q$ squares of side $b$, leaving an $r \times b$ rectangle. The process ends with squares of side $\gcd(a,b)$ — the largest square that tiles the whole rectangle perfectly:

<demo name="euclidean"></demo>

Things worth trying:

- **89 × 55** — consecutive Fibonacci numbers. Every quotient is $1$, so every step slices just one square: the algorithm's *worst case*, spiraling all the way down to a $1\times1$ square (they're coprime).
- **Coprime numbers** (say $35 \times 12$) — the gcd is $1$, and sure enough the tiling bottoms out at unit squares.
- Numbers where one divides the other — the very first slice finishes the job.

## Why it's fast

Each step replaces $(a, b)$ with $(b, r)$ where $r < b$. Better: after two steps the numbers at least *halve* (if $r > b/2$, the next remainder is $b - r$-ish small), so the number of steps is $O(\log \min(a, b))$ — a few dozen steps even for numbers with hundreds of digits. The Fibonacci pair you tried is the provably slowest case (Lamé's theorem, 1844 — arguably the first result in computational complexity): quotients of $1$ shrink the numbers as slowly as possible.

## Running it backwards: Bézout's identity

The division table hides a bonus. Work back up from the bottom, substituting each remainder:

$$
21 = 105 - 2 \cdot 42 = 105 - 2(252 - 2 \cdot 105) = 5 \cdot 105 - 2 \cdot 252
$$

In general, the **extended Euclidean algorithm** produces integers $x, y$ with

$$
a x + b y = \gcd(a, b)
$$

(**Bézout's identity** — the demo computes $x$ and $y$ for you when it finishes). This is the workhorse identity of number theory: when $\gcd(a, n) = 1$ it hands you the **modular inverse** of $a$ modulo $n$ — the exact computation at the heart of RSA key generation. A 2,300-year-old algorithm, load-bearing in your browser's padlock icon.

## A hidden bonus: continued fractions

The quotients the algorithm produces are not junk — they are the **continued fraction** expansion of $a/b$:

$$
\frac{252}{105} = 2 + \cfrac{1}{2 + \cfrac{1}{2}} = [2;\, 2,\, 2]
$$

The demo shows the expansion as it goes. (And remainders-as-states may ring a bell: the [divisibility automaton](/lessons/finite-automata) was also arithmetic living inside a machine's structure.)

## Key takeaways

- $\gcd(a,b) = \gcd(b,\, a \bmod b)$: the pairs share all common divisors, so nothing is lost as the numbers shrink.
- Geometrically: slice the largest square repeatedly; the gcd is the square that tiles the rectangle.
- $O(\log)$ steps, with consecutive Fibonacci numbers as the exact worst case.
- Run backwards it yields Bézout's $ax + by = \gcd$ — the source of modular inverses and a pillar of RSA.
