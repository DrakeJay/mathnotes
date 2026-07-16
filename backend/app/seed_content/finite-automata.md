Strip a computer down to its bare minimum: no memory tape, no variables, no arithmetic — just a **finite set of states** and rules for hopping between them as input arrives, one symbol at a time. That machine is a finite automaton, and it's the ground floor of the theory of computation.

## The machine

A **deterministic finite automaton** (DFA) is five things:

$$
M = (Q, \Sigma, \delta, q_0, F)
$$

- $Q$ — a finite set of **states**
- $\Sigma$ — the **alphabet** of input symbols
- $\delta : Q \times \Sigma \to Q$ — the **transition function**: current state + next symbol → next state
- $q_0 \in Q$ — the start state
- $F \subseteq Q$ — the **accepting** states

It reads the input left to right. Each symbol triggers exactly one transition (that's the *deterministic* part). When the input runs out, the machine answers one bit: **accept** if it's standing in an accepting state, **reject** otherwise.

## A machine that does number theory

Can a device with three states and no arithmetic tell whether a binary number is divisible by 3? Watch the trick. Reading a bit $b$ after having read the number $v$ produces the number $2v + b$ (shift left, add the bit). So the remainder mod 3 updates as

$$
r \;\longmapsto\; (2r + b) \bmod 3
$$

The next remainder depends only on the current remainder and the incoming bit — never on the digits themselves. Three remainders, three states. The machine *is* the arithmetic: state $r_0$ means "what I've read so far is $\equiv 0 \pmod 3$", and $r_0$ is the accepting state.

## Try it

Pick a machine, type an input, and step through it. The highlighted state is where the machine stands; the tape shows what's been consumed:

<demo name="finite-automata"></demo>

Things worth trying:

- On the **divisible by 3** machine, run $1001_2 = 9$ (accepted) and $1010_2 = 10$ (rejected). Watch the annotation track the remainder — the state always knows it.
- On **even number of 1s**, notice the machine is just a light switch: symbol `1` toggles, `0` does nothing.
- On **ends in “ab”**, feed it a long string and watch it care only about the recent past — then break it with a final `a`.
- Feed any machine the **empty string** — it accepts exactly when the start state is accepting.

## The language of a machine

The set of all strings a machine accepts is called its **language**, $L(M)$. Languages recognizable by some DFA are the **regular languages** — and they're closed under union, intersection, and complement (for complement, just swap accepting and non-accepting states: $F \to Q \setminus F$). Regular languages are exactly what regular expressions can describe; every regex engine compiles down to an automaton like the ones above.

## What finite automata cannot do

Here is the boundary, and it's sharp. No DFA recognizes

$$
L = \{\, a^n b^n : n \geq 0 \,\} = \{\varepsilon,\; ab,\; aabb,\; aaabbb,\; \dots\}
$$

The intuition is a counting argument: a machine with $k$ states, fed $a^{k}$, must revisit some state along the way (pigeonhole). The loop between those visits can be repeated — the machine literally cannot tell $a^n$ from $a^{n+\text{loop}}$ — so if it accepts $a^n b^n$, it also accepts $a^{n+\text{loop}} b^n$, which is not in $L$. Finite states means **finite memory**: a DFA can count *mod* a number (that's the div-by-3 trick) but it cannot count *up*. Matching nested parentheses, comparing quantities, parsing arithmetic — all beyond it, and each needs a stronger machine (pushdown automata, then Turing machines).

## Where you've already met them

- **Regex engines and lexers** — every compiler's first pass tokenizes source code with automata; so do the tokenizers that chop text into pieces for language models.
- **Hardware** — sequential circuits are literally state machines clocked by flip-flops.
- **Protocols and UIs** — connection handshakes, vending machines, game logic: anything specified as "states and events."

## Key takeaways

- A DFA is finite states + one deterministic transition per symbol; accept or reject at the end.
- States can encode arithmetic facts — remainder mod 3 needs three states and zero arithmetic.
- DFAs recognize exactly the regular languages, the ones regexes describe.
- Finite memory can count modulo, never unboundedly: $a^n b^n$ is the classic impossibility.
