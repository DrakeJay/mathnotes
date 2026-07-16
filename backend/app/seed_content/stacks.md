The last lesson ended at a wall: a finite automaton cannot recognize $a^n b^n$, because finite states can't count without bound. This lesson is about the simplest thing that breaks through that wall — a **stack**: memory you can only touch from one end.

## Last in, first out

A stack holds a sequence of items but permits exactly two operations:

- $\operatorname{push}(x)$ — place $x$ on **top**
- $\operatorname{pop}()$ — remove and return whatever is on top

No peeking below, no inserting in the middle. The discipline is called **LIFO** — *last in, first out* — like a stack of plates. This restriction sounds crippling; it is actually the point. One consequence you get immediately: push a sequence and pop it all back, and it comes out **reversed** — a stack is a reversing machine.

## The canonical problem: balanced brackets

Is `([{}]())` properly nested? Note that a simple counter isn't enough once there are multiple bracket types — `([)]` has matching *counts* but broken *nesting*. Order matters, and specifically **the most recently opened bracket must close first**. That sentence *is* a stack:

1. Read left to right.
2. **Opening** bracket → push it.
3. **Closing** bracket → pop; it must match the popped opener (if the stack is empty, or the types differ — unbalanced).
4. End of input → balanced exactly when the stack is **empty**.

## Try it

Three stack machines. Step through them and watch the stack grow and shrink:

<demo name="stack-machine"></demo>

Things worth trying:

- Feed the bracket checker `([)]` — counts match, nesting doesn't, and the pop catches it.
- On the **aⁿbⁿ** machine, run `aaabbb`, then break it: `aabbb` (a pop on an empty stack) and `aaabb` (leftovers at the end). This is the language no finite automaton could recognize — one stack is all it took.
- On the **postfix calculator**, evaluate `3 4 + 2 *` and watch $(3+4)\times 2 = 14$ emerge with no parentheses anywhere. Then try `2 3 4 * +` — same numbers, different order, different tree.

## Stacks evaluate arithmetic

The third machine above computes **postfix** (reverse Polish) notation: operands are pushed, and each operator pops two values and pushes the result. Parentheses become unnecessary because the *position* of each operator encodes the grouping. This isn't a curiosity — it is how expression evaluation actually works: compilers translate `(3 + 4) × 2` into stack instructions almost exactly like the ones you just stepped through, and classic HP calculators asked users to type postfix directly.

## The call stack

Every running program uses one giant stack constantly. When a function calls another, the caller's state is *pushed*; when the callee returns, it's *popped* — last called, first returned. Recursion is nothing but this stack at work, and the famous **stack overflow** error is literally this stack running out of room. Nested structure — brackets, function calls, HTML tags, clauses in a sentence — is stack-shaped, and that's why the stack is the data structure for parsing. ([The Stack in Memory](/lessons/stack-in-memory) shows these frames living at real addresses.)

## Pushdown automata: the wall comes down

Bolt a stack onto a finite automaton and you get a **pushdown automaton** (PDA). The machine still reads one symbol at a time with finitely many states, but each transition may also push or pop. The $a^n b^n$ recognizer in the demo is a PDA with a two-phase state and a counter-as-stack:

- reading $a$: push a marker
- reading $b$: pop one
- accept iff the input ends with the stack exactly empty (and no $a$ appears after a $b$)

PDAs recognize the **context-free languages** — a strictly larger class than the regular languages of the last lesson, and the class where most programming-language grammars live. The ladder continues: add a *second* stack (or an infinite tape) and you reach Turing machines, which can compute anything computable. This ladder — regular ⊂ context-free ⊂ decidable — is the **Chomsky hierarchy**, and you have now climbed its first rung.

## A counting aside

How many balanced strings of $n$ bracket pairs are there? The answer is the $n$-th **Catalan number**:

$$
C_n = \frac{1}{n+1}\binom{2n}{n} = 1,\; 1,\; 2,\; 5,\; 14,\; 42,\; 132,\; \dots
$$

The same numbers count binary trees, mountain paths, and polygon triangulations — all secretly the same stack-shaped nesting.

## Key takeaways

- A stack is LIFO memory: push and pop at one end only — and it reverses what passes through it.
- Balanced-bracket checking is the stack's signature move: most recently opened must close first.
- Postfix notation lets a stack evaluate arithmetic with no parentheses; compilers do exactly this.
- Finite automaton + stack = pushdown automaton = context-free languages: $a^n b^n$ falls, and the Chomsky hierarchy begins.
