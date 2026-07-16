The [stacks lesson](/lessons/stacks) treated the stack as a mathematical object — push, pop, LIFO, done. But your computer maintains one *physically*, in RAM, updated millions of times per second. This lesson is about where that stack lives, what a "stack frame" actually is, and why the most famous crash in programming is named after this structure.

## Interface vs. implementation

A stack is defined by its *interface*: push and pop, LIFO order. How it's *implemented* is a separate decision, and the two classic answers teach the core trade-off in data structures:

**An array and one integer.** Reserve a contiguous block of memory and keep an index (call it $\mathit{sp}$, the **stack pointer**) to the current top:

- $\operatorname{push}(x)$: write $x$ at position $\mathit{sp}$, then move $\mathit{sp}$ by one.
- $\operatorname{pop}()$: move $\mathit{sp}$ back by one, read what's there.

Both are $O(1)$ — no searching, no shifting, just one write and one addition. This is as fast as a data structure operation can possibly be, and it's why the hardware stack works this way.

**A linked list.** Each element is a node holding a value and a pointer to the node below; push allocates a node pointing at the old top. Same interface, same $O(1)$, but every push pays for an allocation and the nodes scatter across memory. The array wins when you can bound the size; the list wins when you can't. *Same math, different bytes.*

## The call stack: frames, not just values

The stack your programs live on doesn't hold single values — it holds **frames**. Calling a function pushes a frame containing everything the call needs:

- the function's **arguments** and **local variables**
- the **return address** — where to resume when this call finishes
- bookkeeping (saved registers, the caller's frame pointer)

Returning pops the frame and jumps to the saved return address. The CPU dedicates a register to $\mathit{sp}$, and by convention the stack **grows downward** — each new frame sits at a *lower* address than its caller. Recursion is now demystified: `factorial(4)` calls `factorial(3)` calls `factorial(2)`… and each call is just another frame pushed at the next address down. The recursion's *depth* is exactly the stack's *memory use*.

## Try it

Step through real call traces and watch frames come and go — addresses, stack pointer and all:

<demo name="call-stack"></demo>

Things worth trying:

- **factorial(4)** — a clean dive to the base case and an orderly climb back out, the return values multiplying on the way up.
- **fib(4)** — tree recursion: the stack breathes in and out as branches are explored. Notice `fib(1)` being computed over and over — the wastefulness you can *see* here is what memoization and dynamic programming exist to fix.
- **loop() forever** — infinite recursion. The frames march down until they hit the stack limit, and there's the crash with its proper name.

## Stack vs. heap

A process's memory has two dynamic regions, and they are opposites:

| | **Stack** | **Heap** |
| --- | --- | --- |
| Allocation | move $\mathit{sp}$ — one instruction | search for a free block (`malloc`, `new`) |
| Deallocation | automatic, on return | manual free or garbage collector |
| Lifetime | dies with the function call | as long as you like |
| Size | fixed, small (≈ 1–8 MB) | grows to available RAM |
| Layout | contiguous, cache-friendly | fragments over time |

This is why local variables are cheap and vanish when a function returns — they lived in the frame that just got popped. It's also why returning a pointer to a local variable is a classic bug: the memory still exists, but the next push will overwrite it.

## Why the crash is called that

The stack region is fixed in size. Recurse too deep — or forever — and $\mathit{sp}$ walks past the boundary: a **stack overflow**. The runtime kills the program rather than let it scribble on memory it doesn't own. That's the whole story behind the error name (and the website named after it). Two practical notes: an iterative loop with an explicit stack data structure can replace deep recursion when the input is large, and some languages perform **tail-call optimization** — when the recursive call is the very last act of a function, the compiler reuses the current frame instead of pushing a new one, making the recursion effectively free.

## Key takeaways

- One interface, many implementations: array + stack pointer (contiguous, $O(1)$ by pointer arithmetic) or linked nodes — *choosing representations is what data structure design is.*
- A call pushes a frame (arguments, locals, return address); a return pops it. Recursion depth = memory.
- Stack allocation is a pointer bump with automatic cleanup; the heap trades speed for flexible lifetimes.
- The stack region is finite — unbounded recursion overflows it, hence the name.
