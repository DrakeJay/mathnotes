One of the oldest theorems in mathematics — attributed to Thales of Miletus, around 600 BC — and still one of the most elegant: put a triangle's long side on a circle's diameter, and the opposite corner is *forced* to be a right angle, no matter where on the circle it sits.

## The statement

Let $AB$ be a **diameter** of a circle, and let $C$ be any other point on the circle. Then

$$
\angle ACB = 90^\circ
$$

Every point of the circle "sees" the diameter at a right angle.

## Try it

Drag $C$ anywhere around the circle and watch the angle at $C$:

<demo name="thales"></demo>

The two colored angles are the key to the proof below: wherever $C$ goes, the angle at $C$ is split by the radius $OC$ into a copy of the angle at $A$ and a copy of the angle at $B$.

## The proof (three radii, two isosceles triangles)

Draw the radius $OC$. Now the figure contains three equal segments:

$$
OA = OB = OC = r
$$

- Triangle $OAC$ has two equal sides ($OA = OC$), so it is **isosceles**, and its base angles are equal: $\angle OAC = \angle OCA = \alpha$.
- Triangle $OBC$ is isosceles the same way: $\angle OBC = \angle OCB = \beta$.

The angle at $C$ is made of one $\alpha$ and one $\beta$, so $\angle ACB = \alpha + \beta$. Now add up the angles of the big triangle $ABC$:

$$
\underbrace{\alpha}_{\text{at } A} + \underbrace{(\alpha + \beta)}_{\text{at } C} + \underbrace{\beta}_{\text{at } B} = 180^\circ
\;\;\Longrightarrow\;\;
\alpha + \beta = 90^\circ
$$

That's the whole proof: two isosceles triangles and the fact that a triangle's angles sum to $180^\circ$.

## The converse is just as useful

If $\angle ACB = 90^\circ$, then $C$ lies **on** the circle with diameter $AB$. (In a right triangle, the midpoint of the hypotenuse is equidistant from all three vertices — so a right angle can never sit inside or outside the circle, only on it.)

Together, the theorem and its converse say: *the set of all points that see a segment at a right angle is exactly a circle with that segment as diameter* (minus the endpoints). This circle is called the **Thales circle** of the segment — remember it, because the equal tangent lesson uses it as a construction tool.

## A practical corollary

Need the center of a circular plate? Place a right angle (a set square, a sheet of paper's corner) against the rim at any point $C$: its two edges cross the rim at the ends of a diameter. Do it twice from two different spots — the diameters intersect at the center.

## Key takeaways

- A diameter is seen at $90^\circ$ from every point of its circle.
- The proof: radii make isosceles triangles; base angles give $2\alpha + 2\beta = 180^\circ$.
- The converse holds too, so right angles can be *constructed* with circles — and circles located with right angles.
- This is a special case of the next lesson's inscribed angle theorem: a diameter subtends a central angle of $180^\circ$, and the inscribed angle is half of it.
