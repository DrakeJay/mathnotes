Most geometry you've seen is *Cartesian*: shapes described from the outside, by coordinates. Turtle geometry describes shapes from the *inside* — as instructions to a walker who never knows where it is, only what to do next. Add one idea on top (rewrite the instructions, over and over) and five-character programs start growing snowflakes, dragons, and plants.

## The turtle

Imagine a turtle holding a pen. It understands a tiny language:

| Symbol | Meaning |
| --- | --- |
| `F` | walk forward one step, drawing a line |
| `+` | turn left by the turn angle |
| `-` | turn right by the turn angle |
| `[` | remember the current position and heading |
| `]` | jump back to the last remembered state |

That's the whole language. With the turn angle at $90°$, the program `F+F+F+F` walks a square. Notice what's *not* in the language: no coordinates, no "move to the point $(2, 3)$." Every instruction is **local** — relative to where the turtle already is and which way it faces. This is geometry the way an ant experiences it, and it's how Seymour Papert taught children mathematics with the Logo language in the 1970s.

<demo name="turtle-playground"></demo>

Two things worth discovering in the playground:

- **Closed shapes are about turning, not walking.** Load the square, the triangle, the star: in every closed loop the turns add up to a full spin — $4 \times 90°$, $3 \times 120°$, $5 \times 144° = 720°$ (the star winds around twice). This is the *Total Turtle Trip Theorem*: a turtle that comes home facing the way it started has turned through a multiple of $360°$, no matter the path.
- **A circle is just a polygon that gave up.** Load *almost-circle*: 24 small steps and 24 small turns. The regular polygon with tiny sides *is* the circle, for every practical purpose — which is exactly how computers draw them.

The bracket commands are sneakily important: `[` and `]` are a **stack** — push the turtle's state, pop it back. It's the same last-in-first-out discipline from the [stacks lesson](/lessons/stacks), and it's what lets one line of turtle code fork into branches: `F[+F][-F]F` is a twig.

## L-systems: programs that rewrite themselves

In 1968 the biologist Aristid Lindenmayer wanted to model how plants grow. His insight: growth is **rewriting**. Every cell follows the same rule simultaneously — a bud becomes a stem with new buds, and next season each new bud does it again.

An **L-system** is exactly that, on strings:

- an **alphabet** of symbols (our turtle commands, plus placeholders),
- an **axiom** — the starting string,
- **production rules** — each symbol's replacement, applied to *every* symbol at once, in parallel.

Take the rule $F \to F{-}F{+}{+}F{-}F$ with the axiom `F++F++F` (a triangle, at $60°$):

| Iteration | String | Segments |
| --- | --- | --- |
| 0 | `F++F++F` | 3 |
| 1 | `F-F++F-F++F-F++F-F++F-F++F-F` | 12 |
| 2 | (112 characters) | 48 |
| $n$ | — | $3 \cdot 4^n$ |

Every segment becomes four smaller ones, forever. Hand the string to the turtle and the triangle grows into the **Koch snowflake**.

If this looks like the grammars from the [finite automata lesson](/lessons/finite-automata), it should — L-systems are formal grammars. The twist is that rules fire *in parallel* rather than one at a time, which is what makes them a model of growth instead of derivation.

<demo name="l-systems"></demo>

Things to try:

- **Koch snowflake, iterations 0 → 5.** Watch the same rule act at every scale. Then drag the angle off $60°$ — the snowflake shatters into new families of curves.
- **Dragon curve.** This is a real paper-folding experiment: fold a strip of paper in half $n$ times, open every crease to $90°$, and this shape appears. Set the angle to $120°$ for a very different dragon.
- **Sierpiński arrowhead.** A single unbroken line, no lifting, no branching — yet it fills the Sierpiński triangle.
- **Fractal plant.** Five symbols of grammar, and the brackets do the botany: every `[…]` is a side branch that grows by the same rule as the trunk. Slide iterations from 0 up and it visibly *grows*.

## Fractal dimension

The Koch curve raises an honest question: how *big* is it? Each iteration multiplies its length by $4/3$, so the finished curve is infinitely long — yet it encloses no area. It's more than a line, less than a surface.

The resolution is to let dimension be a measurement rather than an integer. For a shape assembled from $N$ copies of itself, each scaled down by a factor $s$:

$$
d \;=\; \frac{\ln N}{\ln s}
$$

Sanity checks: a segment is 2 copies at half scale, $d = \ln 2/\ln 2 = 1$. A filled square is 4 copies at half scale, $d = \ln 4 / \ln 2 = 2$. And the Koch curve is 4 copies at one-*third* scale:

$$
d \;=\; \frac{\ln 4}{\ln 3} \;\approx\; 1.262
$$

A dimension of about $1.26$: genuinely between line and plane. The Sierpiński triangle (3 copies at half scale) gets $\ln 3/\ln 2 \approx 1.585$; the dragon curve manages exactly $2$ — a curve that fills area. This isn't a party trick either: coastlines, lungs, river networks, and lightning all measure at fractional dimensions, and for the same reason as the plant preset — they grew by local rules applied at every scale.

## The whole machine in Python

Both demos run on the same few lines — a rewriter and a walker:

```python
import math

def expand(axiom, rules, n):
    """Apply every rule to every symbol, n times (parallel rewriting)."""
    s = axiom
    for _ in range(n):
        s = "".join(rules.get(ch, ch) for ch in s)
    return s

def turtle_path(commands, angle_deg, draw="F", heading=0.0):
    """Walk the string; return the polylines the pen traced."""
    a = math.radians(angle_deg)
    x = y = 0.0
    h = math.radians(heading)
    stack, paths, current = [], [], [(0.0, 0.0)]
    for ch in commands:
        if ch in draw:
            x, y = x + math.cos(h), y + math.sin(h)
            current.append((x, y))
        elif ch == "+": h += a
        elif ch == "-": h -= a
        elif ch == "[": stack.append((x, y, h))
        elif ch == "]":
            if len(current) > 1: paths.append(current)
            x, y, h = stack.pop()
            current = [(x, y)]
    if len(current) > 1: paths.append(current)
    return paths

plant = expand("X", {"X": "F+[[X]-X]-F[-FX]+X", "F": "FF"}, n=5)
paths = turtle_path(plant, 25, heading=65)   # ~1,500 segments of botany
```

Unknown symbols (like the plant's `X`) simply pass through the walker — they exist only to shape the *grammar*, not the drawing. That separation, bookkeeping symbols steering visible ones, is the same trick compilers and automata play everywhere in computer science.

## The takeaway

Turtle geometry replaces "where things are" with "what to do next," and L-systems replace "draw this shape" with "apply this rule everywhere, again." Neither knows anything about snowflakes or ferns. Complexity isn't in the description — three rules, one stack, one walking turtle — it's in the *iteration*. That is the deepest lesson fractals have to teach, and you can now grow one from a string you can read.
