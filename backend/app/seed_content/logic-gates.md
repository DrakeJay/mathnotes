Every computation your machine performs — the NumPy demos on this site, the browser rendering this page — bottoms out in circuits built from a handful of one-bit functions called **logic gates**. This lesson goes from true/false to a circuit that does arithmetic.

## Boolean values and the basic gates

A **bit** takes one of two values: $0$ (false) or $1$ (true). A **gate** is simply a function on bits, small enough to specify completely by listing every case — a **truth table**. The classics:

| $A$ | $B$ | $A \land B$ (AND) | $A \lor B$ (OR) | $A \oplus B$ (XOR) | $\lnot(A \land B)$ (NAND) |
| --- | --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 0 | 0 | 1 |
| 0 | 1 | 0 | 1 | 1 | 1 |
| 1 | 0 | 0 | 1 | 1 | 1 |
| 1 | 1 | 1 | 1 | 0 | 0 |

plus the one-input **NOT**: $\lnot 0 = 1$, $\lnot 1 = 0$.

Two of these deserve a second look:

- **XOR** is *exclusive* or — true when the inputs **differ**. Arithmetically, $A \oplus B = (A + B) \bmod 2$: XOR is addition without the carry. Remember that.
- **NAND** looks like an afterthought, but it is about to turn out to be the only gate you need.

## Try it

Flip the switches and watch the signals flow — bright wires carry a $1$. Work through all four circuits:

<demo name="logic-gates"></demo>

Things worth trying:

- In the single-gate explorer, find each gate's *controlling* input: an AND with any input $0$ is dead; an OR with any input $1$ is stuck on.
- In **XOR from NAND**, set $A=1, B=0$ and trace the four NANDs by hand — the bright path *is* the proof.
- In the **half adder**, set both switches to $1$: Sum goes dark, Carry lights up. That is $1+1=10_2$.
- In the **full adder**, turn everything on: $1+1+1 = 11_2$. Three bits in, two bits out.

## One gate to rule them all

Here is a small shock: **NAND alone can build everything**.

$$
\lnot A = A \barwedge A, \qquad
A \land B = \lnot(A \barwedge B), \qquad
A \lor B = (\lnot A) \barwedge (\lnot B)
$$

The last identity is one of **De Morgan's laws** — negation swaps AND with OR:

$$
\lnot(A \land B) = \lnot A \lor \lnot B,
\qquad
\lnot(A \lor B) = \lnot A \land \lnot B
$$

Since NOT, AND, and OR can express *any* truth table (read each row where the output is $1$, AND together that row's input conditions, OR the rows together — the "sum of products"), NAND can express any Boolean function whatsoever. The demo's XOR-from-four-NANDs is this universality in action, and it's why real chips are often manufactured as oceans of a single gate type.

## From logic to arithmetic

Add two bits: the answer needs *two* bits, a sum and a carry — and both are gates you know:

$$
\text{Sum} = A \oplus B, \qquad \text{Carry} = A \land B
$$

That pair is the **half adder**. To add full binary numbers you also need to accept an incoming carry: the **full adder** takes $A$, $B$, $C_{\text{in}}$ and produces sum and carry-out (two XORs, two ANDs, an OR — trace it in the demo). Chain one full adder per bit, each carry-out feeding the next carry-in, and you have a **ripple-carry adder**: numbers of any width, added by nothing but the truth tables above. Multiplication, comparison, the whole ALU — it's this move repeated with more gates.

## A neural postscript

A single artificial neuron from the [backpropagation lesson](/lessons/backpropagation) can implement AND, OR, and NOT — draw the truth tables in the plane and one line separates the 1s from the 0s. But **XOR defeats it**: its 1s sit diagonal, and no single line splits them. That's why the XOR dataset in that lesson's demo needs a hidden layer, and it's the famous limitation that stalled neural-network research in 1969. Gates and neurons are close cousins — both compute Boolean functions — and XOR is exactly where their difference shows.

## Key takeaways

- Gates are just small Boolean functions; a truth table specifies one completely.
- XOR is addition mod 2; NAND is universal — any truth table reduces to it via De Morgan and sum-of-products.
- Half adder = XOR + AND; full adders chain into arithmetic on numbers of any width.
- Hardware is a tower: transistors → gates → adders → ALU → the machine running this page.
