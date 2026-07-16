Thales' theorem said a diameter is seen at $90^\circ$ from anywhere on the circle. The inscribed angle theorem is the full story: *any* chord is seen at a constant angle from its arc — and that angle is exactly half the angle at the center.

## The statement

Take two points $A$ and $B$ on a circle with center $O$, and a third point $C$ on the circle. The **central angle** $\angle AOB$ and the **inscribed angle** $\angle ACB$ subtend the same arc $\stackrel{\frown}{AB}$ (the one not containing $C$), and

$$
\angle ACB \;=\; \tfrac{1}{2}\,\angle AOB
$$

## Try it

Drag all three points. The red arc is the one being subtended; watch the two angle readouts keep their $2:1$ ratio — and notice what happens (or rather, doesn't) when you slide $C$ along its arc:

<demo name="inscribed-angle"></demo>

## The proof idea

**The clean case first.** Suppose the chord $CB$ passes through the center $O$. Triangle $OAC$ is isosceles ($OA = OC = r$), so its base angles are equal: $\angle OCA = \angle OAC = \gamma$. The central angle $\angle AOB$ is an **exterior angle** of that triangle, and an exterior angle equals the sum of the two remote interior angles:

$$
\angle AOB = \gamma + \gamma = 2\gamma = 2\,\angle ACB
$$

**Every other case reduces to this one.** Draw the diameter from $C$ through $O$. It splits both the inscribed angle and the central angle into two pieces (or expresses each as a difference of two pieces), and each piece is a clean case. Adding (or subtracting) finishes the proof — same isosceles-triangle move as in Thales' proof, used twice.

## Three consequences worth knowing

**1. Angles in the same segment are equal.** The theorem's most-used form: every inscribed angle on the same arc equals $\tfrac{1}{2}\angle AOB$, so any two points $C, C'$ on that arc see the chord $AB$ at *the same angle*. That's what you observed dragging $C$ — the angle refuses to change.

**2. Thales' theorem is the special case** where $AB$ is a diameter: the central angle is $180^\circ$, so every inscribed angle is $90^\circ$.

**3. Cyclic quadrilaterals.** Put $C$ and $D$ on *opposite* arcs of the chord $AB$. Their two arcs make up the whole circle, so the two central angles sum to $360^\circ$ — and the two inscribed angles sum to $180^\circ$. Opposite angles of any quadrilateral inscribed in a circle are supplementary. (Try it in the demo: drag $C$ across the chord to the other arc and compare the readouts.)

## Key takeaways

- Inscribed angle $=\tfrac12\,$ central angle, on the same arc.
- Proof: isosceles triangle + exterior angle, then reduce every configuration to that case with a diameter.
- All points of one arc see the chord at the same angle — a circle is an "equal-angle" curve.
- Thales ($90^\circ$) and cyclic quadrilaterals ($180^\circ$ opposite angles) drop out as corollaries.
