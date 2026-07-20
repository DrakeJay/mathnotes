Sorting is the most-studied problem in computer science, and not because computers love tidy lists. Sorted data is what makes [binary search](/lessons/search-algorithms) possible — one preprocessing pass buys an exponential speedup on every lookup afterwards. The question is what that pass costs, and the answer depends on *which* sort and *what* the data already looks like.

## The cost model

We count **operations**: comparisons ("is $a_i > a_j$?") and element moves (swaps and writes). Wall-clock time varies with hardware; operation counts are properties of the algorithm itself. For an array of $n$ elements, the interesting question is how the count grows with $n$ — the difference between $n^2$ and $n \log_2 n$ is the difference between 1,000,000 and about 10,000 at $n = 1{,}000$.

## Two humble sorts

**Bubble sort** sweeps the array, swapping every adjacent pair that's out of order. After one sweep the largest element has "bubbled" to the end — that's the invariant — so each sweep can stop one position earlier. Worst case: $\binom{n}{2} \approx n^2/2$ comparisons *and* about as many swaps.

**Insertion sort** grows a sorted prefix: take the next element, walk it left past everything bigger, drop it in place — how most people sort a hand of cards. Also $O(n^2)$ in the worst case, but with a redeeming feature bubble sort lacks: it's **adaptive**. Each element only walks as far as it is out of place. On an array that's *almost* sorted, insertion sort does almost nothing — $O(n)$ — which is why real systems use it to finish the job on nearly-sorted data.

## Two divide-and-conquer sorts

**Merge sort** splits the array in half, sorts each half (recursively), then merges the two sorted halves in one zip-through. The recursion is $\log_2 n$ levels deep and every level does $O(n)$ work, so the total is $O(n \log n)$ — *guaranteed*, whatever the input. The price is extra memory for the merge.

**Quicksort** picks a **pivot**, partitions the array into smaller-than and bigger-than piles in place, and recurses on each pile. On average it does $O(n \log n)$ with a small constant and no extra array — the reason it's the default in practice. But the average hides an if: it needs pivots that split evenly. The version racing below deliberately uses the classic textbook choice, the *last element* — remember that when you watch it run.

## The race

Same starting array in all four panels; every comparison, swap, and write costs one tick. Pick the starting order and press Race.

<demo name="sorting-race"></demo>

Run all three starting orders — the podium changes every time:

- **Shuffled.** The $n \log n$ pair laps the $n^2$ pair, and quicksort's small constant edges out merge sort.
- **Nearly sorted.** Insertion sort wins the whole race in a few dozen operations — the adaptive $O(n)$ case in action — while quicksort *pays* for its cleverness: partitioning shuffles order it never needed to disturb.
- **Reversed.** Quicksort's nightmare: the last element is always the minimum, every partition is maximally lopsided, and the "fast" sort degrades to $O(n^2)$ while steady merge sort cruises to the win. Production quicksorts dodge this by picking pivots randomly or by median-of-three — the lesson isn't "quicksort is fragile," it's "average-case guarantees are only as good as your randomness."

There is no best sorting algorithm. There is a best sorting algorithm *for what you know about your data* — which is why Python's built-in sort (Timsort) is a hybrid: merge sort's guarantees with insertion sort's speed on the nearly-sorted runs real data is full of.

## Why n log n is the floor

Could some undiscovered algorithm sort with, say, $O(n)$ comparisons? No — and the proof fits in a paragraph. A comparison has two outcomes, so an algorithm making $k$ comparisons can distinguish at most $2^k$ different input orderings. But $n$ elements can arrive in $n!$ orderings, and a correct sort must treat each one differently. So it needs

$$
2^k \ge n! \quad\Longrightarrow\quad k \ge \log_2 n! \approx n \log_2 n - 1.44\,n
$$

(using Stirling's approximation). Merge sort sits essentially on this floor. It's the same counting argument that made $\log_2 n$ unbeatable for [searching a sorted array](/lessons/search-algorithms): every yes/no question can at best halve your uncertainty, and sorting starts with $\log_2 n!$ bits of it.

## Both families in Python

```python
def insertion_sort(a):                    # O(n²), but O(n) when nearly sorted
    for k in range(1, len(a)):
        x, i = a[k], k - 1
        while i >= 0 and a[i] > x:        # walk x left past bigger elements
            a[i + 1] = a[i]
            i -= 1
        a[i + 1] = x
    return a

def merge_sort(a):                        # O(n log n), guaranteed
    if len(a) < 2:
        return a
    mid = len(a) // 2
    left, right = merge_sort(a[:mid]), merge_sort(a[mid:])
    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:           # <= keeps equal elements in order
            out.append(left[i]); i += 1
        else:
            out.append(right[j]); j += 1
    return out + left[i:] + right[j:]
```

The `<=` in the merge is doing quiet, important work: it makes the sort **stable** — elements that compare equal keep their original order, so sorting people by last name doesn't scramble an earlier sort by first name. Stability is why merge-family sorts power standard libraries even where quicksort would be marginally faster.

## The takeaway

Four algorithms, one problem, three different winners depending on the input — and a mathematical floor none of them can beat. Sorting is the cleanest example of the central lesson of algorithm analysis: "fast" is not a property of code, it's a relationship between an algorithm and the data you feed it.
