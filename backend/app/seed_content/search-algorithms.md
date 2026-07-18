Think of the guessing game: I pick a number from 1 to 100, you guess, I answer "higher" or "lower." Nobody guesses 1, then 2, then 3 — you guess 50, then 75, then 88… and pin it down in at most seven guesses. That instinct, made precise, is the difference between the two fundamental search algorithms — and one of the deepest ideas in computer science: **structure is information, and information is speed.**

## The problem

Given a collection of $n$ items and a target, find where the target is (or report that it's absent). How fast you can do this depends entirely on what you *know* about the collection.

## Linear search: knowing nothing

If the items are in no particular order, there is nothing clever to do: check them one at a time.

- Works on **any** collection, sorted or not.
- Worst case: $n$ comparisons — the target is last, or missing. We say it runs in $O(n)$ time: double the data, double the work.

## Binary search: knowing the order

If the array is **sorted**, one comparison tells you vastly more. Compare the target with the *middle* element:

- equal → found;
- target is smaller → it can only be in the **left half**;
- target is larger → it can only be in the **right half**.

Either way, half the array is eliminated by a single comparison. Keep an interval $[\mathit{lo}, \mathit{hi}]$ that provably contains the target (if present), probe its midpoint, and shrink:

$$
n \;\to\; \tfrac{n}{2} \;\to\; \tfrac{n}{4} \;\to\; \cdots \;\to\; 1
\qquad\text{in about } \log_2 n \text{ steps}
$$

That logarithm is absurdly small: a million items → $20$ comparisons. Four billion → $32$. Every entry in a phone book for the whole planet → about $33$.

## Try it

Race both algorithms on the same sorted array. Step through and watch linear crawl while binary's interval collapses:

<demo name="binary-search"></demo>

Things worth trying:

- Search for the **largest value** — linear's worst case, binary barely notices.
- Search for a number that **isn't there** (say one between two array values) — linear must check everything before giving up; binary knows the moment its interval closes to nothing.
- Search for the **middle element** — binary wins in one comparison; linear still walks half the array.

## Why you can't beat the logarithm

Each yes/no comparison has two outcomes, so $k$ comparisons can distinguish at most $2^k$ different answers. To tell apart $n+1$ possible outcomes ("it's at index $0$…$n{-}1$" or "absent") you *need* $k \ge \log_2(n+1)$ comparisons in the worst case. Binary search doesn't just happen to be fast — it is **optimal** for comparison-based searching, extracting a full bit of information from every question. (The same bits-and-questions arithmetic appeared as entropy in the [softmax lesson](/lessons/softmax-cross-entropy) — it is the same currency.)

## Famously easy, famously buggy

Binary search's idea is simple; its *implementation* is a minefield of off-by-one errors — a classic study found bugs in most professional attempts, and the binary search in Java's standard library harbored an overflow bug (`(lo + hi) / 2` overflowing for huge arrays) for nine years before anyone noticed. The fix, `lo + (hi - lo) / 2`, is a tiny monument to humility. The discipline that saves you is the **invariant**: state precisely what $[\mathit{lo}, \mathit{hi}]$ promises, and make every branch preserve it.

## The idea generalizes everywhere

"Repeatedly halve the possibilities" works far beyond arrays:

- **Bisection root-finding**: a continuous function that's negative at $a$ and positive at $b$ crosses zero in between — halve the interval to squeeze the root. This is how you compute $\sqrt{2}$ by hand, and it's binary search on the real line.
- **Binary search the answer**: many optimization problems ("what's the smallest capacity that works?") have a monotone yes/no structure — search the answer space itself.
- **`git bisect`** finds the commit that broke your build in $\log_2(\text{commits})$ test runs.
- The **divisibility automaton** and the **Euclidean algorithm's** $O(\log)$ bound are cousins in spirit: exploiting structure so work shrinks geometrically.

## Key takeaways

- Unsorted data forces $O(n)$ linear search; sorted data unlocks $O(\log n)$ binary search.
- Maintain the invariant "target, if present, lies in $[\mathit{lo}, \mathit{hi}]$" and halve — a million items fall in twenty comparisons.
- The logarithm is a *lower bound*: one comparison yields at most one bit, and you need $\log_2 n$ bits.
- Halving-the-possibilities is a general weapon: bisection, answer-space search, `git bisect`.
