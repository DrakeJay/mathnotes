The [CPU lesson](/lessons/cpu-fetch-decode-execute) quietly cheated. It drew memory as a single tidy array the processor reads in one tick. Real memory is nothing like that: it is a hierarchy of very different technologies, and the speed gap between the fastest and slowest is so enormous that managing it is one of the central problems of computer performance.

## The problem: fast memory is small, big memory is slow

There is no single memory technology that is simultaneously huge, cheap, and fast. So computers use several at once, arranged in a pyramid — tiny and instant at the top, vast and sluggish at the bottom:

| Level | Typical size | Latency (cycles) | If one cycle were 1 second… |
| --- | --- | --- | --- |
| Register | ~1 KB | ~1 | 1 second |
| L1 cache | ~64 KB | ~4 | 4 seconds |
| L2 cache | ~1 MB | ~12 | 12 seconds |
| L3 cache | ~32 MB | ~40 | 40 seconds |
| Main memory (RAM) | ~16 GB | ~200 | **3½ minutes** |
| SSD | ~1 TB | ~100,000 | **1½ days** |
| Hard disk | ~4 TB | ~10,000,000 | **4 months** |

Read that last column again. If getting a value from a register felt like one second, then reaching out to RAM would feel like waiting three and a half minutes, and touching a spinning disk would feel like waiting a *third of a year*. From the CPU's point of view, main memory is not "instant array access" — it is a long, painful road trip, and every cache miss buys another ticket.

## The fix: cache, betting on locality

A **cache** is a small, fast copy of the memory the CPU is using right now. When the processor asks for an address, the hardware checks the cache first. A **hit** is answered in a few cycles; a **miss** means the slow trip to RAM — and, crucially, a copy is left in the cache on the way back.

Caching only helps if the future looks like the past. Fortunately real programs have **locality**, in two flavors:

- **Temporal locality** — if you used an address recently, you'll probably use it again soon (a loop counter, a running total).
- **Spatial locality** — if you used an address, you'll probably use its neighbors soon (marching through an array, fields of a struct).

To exploit spatial locality, caches don't store single words; they store **blocks** (also called cache lines) of several adjacent words. One miss drags in a whole neighborhood, so the next few accesses are hits for free.

## See it pay off — or not

The cache below is *direct-mapped*: each memory address maps to exactly one cache line (block = address ÷ 4, line = block mod 8), so whether you hit depends entirely on your access pattern. A hit costs 4 cycles; a miss costs ~200. Run each pattern and watch the hit rate — and the average access time — swing wildly.

<demo name="cache"></demo>

- **Sequential scan** (`0, 1, 2, …`). Every 4th access is a miss (a new block), the other three are hits — a **75%** hit rate from spatial locality alone, and you did nothing to earn it except walk memory in order.
- **Loop over a small array** (16 words, over and over). After one cold pass of misses, the whole array sits in cache and *every* later access hits — a **~94%** hit rate. This is temporal locality, and it's why tight loops over small data are so fast.
- **Random access.** Locality destroyed. Barely a third of accesses hit, and the average access time balloons toward RAM's 200 cycles. Same data, same cache, same amount of "work" — but roughly **five times slower** than the sequential scan.

The three patterns touch the exact same memory and run the exact same number of accesses. The only thing that changed is the *order*, and it moved performance by 5×. That is the whole reason a working programmer needs to know the cache exists.

## Why this leaks into everything

The memory hierarchy is invisible in your source code — `array[i]` looks identical whether it hits L1 or falls through to RAM — but it decides how fast that code runs:

- **Row-major vs. column-major.** Iterating a 2-D array along the wrong axis strides through memory, defeats spatial locality, and can run an order of magnitude slower — same math, same output.
- **Arrays beat linked lists** far more than their $O(\cdot)$ notation suggests: array elements are neighbors (spatial locality), while linked-list nodes are scattered, so every hop risks a miss.
- **This is what "cache-friendly" means** — the phrase behind a huge fraction of real-world optimization. The [sorting](/lessons/sorting-algorithms) and [searching](/lessons/search-algorithms) lessons counted operations; on real hardware, *where* those operations land in the hierarchy often matters just as much as *how many* there are.

## The takeaway

A processor is fast, but the memory feeding it mostly isn't — the gap spans seven orders of magnitude, from a one-cycle register to a ten-million-cycle disk. Caches paper over that gap by betting on locality, and the bet usually pays because real programs reuse recent data and their neighbors. The practical upshot is unintuitive but freeing: the *pattern* in which your code touches memory can matter more than how much work it does, and simply keeping your data small and your loops orderly is often the best optimization there is.
