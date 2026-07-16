Stand outside a circle and draw the two lines that just graze it. The two tangent segments — from your point to the two points of tangency — *look* about equal. The equal tangent theorem says they are exactly equal, always, and the proof is two right triangles.

## The statement

Let $P$ be a point outside a circle with center $O$ and radius $r$, and let the two tangents from $P$ touch the circle at $T_1$ and $T_2$. Then

$$
PT_1 = PT_2 = \sqrt{d^2 - r^2}, \qquad d = OP
$$

## Try it

Drag $P$ anywhere outside the circle. The two tangent lengths update — and never disagree:

<demo name="equal-tangents"></demo>

## The proof (two triangles, one hypotenuse)

The one fact tangents give you: **a tangent is perpendicular to the radius at the point of tangency** (if it weren't, the line would cross into the circle). So $\angle OT_1P = \angle OT_2P = 90^\circ$, and the figure contains two right triangles, $OT_1P$ and $OT_2P$. Compare them:

- $OT_1 = OT_2 = r$ — both legs are radii,
- $OP$ is **shared** — the same hypotenuse for both.

Two right triangles with an equal leg and an equal hypotenuse are congruent, so the remaining sides match:

$$
PT_1 = PT_2
$$

and Pythagoras in either triangle gives the length: $PT^2 = OP^2 - r^2$. The congruence also hands you a bonus: $\angle OPT_1 = \angle OPT_2$, so the line $OP$ **bisects** the angle between the tangents — the whole figure is a kite, symmetric about $OP$.

## How do you *find* the tangent points?

Given $P$ and the circle, where exactly are $T_1$ and $T_2$? The previous lessons answer it. A tangent point $T$ must satisfy $\angle OTP = 90^\circ$ — and by the **converse of Thales' theorem**, every point that sees the segment $OP$ at a right angle lies on the circle with diameter $OP$. So:

1. Draw the circle with diameter $OP$ (the *Thales circle* of $OP$).
2. It cuts the original circle in two points — exactly $T_1$ and $T_2$.

A compass-and-straightedge construction, powered entirely by the last two lessons.

## Where it shows up

- **The incircle.** A triangle's inscribed circle touches all three sides; the equal tangent theorem pairs up the six tangent segments from the three vertices, which is the engine behind many triangle-geometry formulas.
- **Belts and pulleys.** The straight sections of a belt around two wheels are tangent segments; equal tangents keep the geometry symmetric.
- **Any "kissing" configuration** — coins on a table, circles inscribed in polygons — starts with equal tangents.

## Key takeaways

- The two tangent segments from an external point are equal: $PT_{1,2} = \sqrt{d^2 - r^2}$.
- Proof: radius ⊥ tangent gives two right triangles sharing a hypotenuse — congruent.
- $OP$ bisects the angle between the tangents; the figure is a kite.
- The tangent points are constructed with the Thales circle over $OP$ — the lessons stack.
