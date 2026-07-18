The [probability lesson](/lessons/probability) went one direction: given a model (a fair coin), deduce what data will look like. **Statistics goes the other way**: given data, figure out what's behind it. Its first tools are embarrassingly simple — three numbers that summarize a pile of measurements — but each hides real mathematics, and one of them secretly runs machine learning.

## The mean: a balance point

The **mean** (average) of $x_1, \dots, x_n$ is

$$
\bar x = \frac{1}{n} \sum_{i=1}^n x_i
$$

Its best mental picture is physical: put equal weights at each data point on a ruler, and $\bar x$ is where the ruler **balances**. That picture also exposes its weakness — a single weight far out on the ruler shifts the balance point a lot. The mean listens to *everyone*, including the loudmouth.

## The median: the middle voter

Sort the data; the **median** is the middle value (or the average of the middle two). It answers "what's typical?" by rank, not by magnitude — so an extreme value can pull it by at most one position. When a billionaire walks into a bar, the *mean* wealth makes everyone a millionaire; the *median* barely blinks. That robustness is why income, house prices, and anything with a heavy tail get reported as medians.

## Try it

Drag the points. Watch which summary chases the outlier and which refuses to care:

<demo name="descriptive-stats"></demo>

Things worth trying:

- Load the **billionaire** preset: the mean lands above all but one data point — as a "typical value" it describes *nobody*.
- Drag the outlier slowly rightward: the mean follows linearly; the median doesn't move at all.
- Turn on **squared deviations**: each square's area is one point's $(x_i - \bar x)^2$. The variance is the *average area* — and watch the outlier's square dwarf all others combined. Squaring doesn't just remove signs; it makes extremes shout.

## Measuring spread

Two datasets can share a mean and be wildly different — one huddled, one scattered. The deviations $x_i - \bar x$ measure scatter, but they always **sum to zero** (that's what balancing means), so average them squared:

$$
\sigma^2 = \frac{1}{n}\sum_{i=1}^n (x_i - \bar x)^2
\qquad\qquad
\sigma = \sqrt{\sigma^2}
$$

$\sigma^2$ is the **variance**; its square root $\sigma$, the **standard deviation**, comes back in the original units (dollars, not dollars²) and earns a place on the plot: the shaded band $\bar x \pm \sigma$ is where the "typical" data lives. For bell-shaped data — like the [Galton board's](/lessons/probability) histogram — the **68–95–99.7 rule** holds: about 68% of the data within one $\sigma$, 95% within two, 99.7% within three.

(One honest footnote: when your $n$ points are a *sample* from something bigger, dividing by $n-1$ instead of $n$ gives a better variance estimate. The demo uses $n$; the distinction only matters for small samples.)

## The theorem hiding in the summaries

Why *these* two centers? Each is the answer to an optimization problem:

- The **mean** is the value $c$ minimizing the sum of **squared** distances $\sum (x_i - c)^2$. (Differentiate, set to zero — out pops $\bar x$.)
- The **median** is the value $c$ minimizing the sum of **absolute** distances $\sum |x_i - c|$.

If that split feels familiar, it should: it is exactly the difference between **L2 (squared-error) loss** and **L1 (absolute-error) loss** in machine learning. Train a model with mean-squared error — as the [neural-network demo](/lessons/backpropagation) does with its close cousin — and you are asking for conditional *means*, sensitive to outliers; train with absolute error and you're asking for *medians*, robust to them. The billionaire in the bar is the same character as the mislabeled example that wrecks your regression. And the "z-scores" used to normalize features before training are just data re-expressed in units of $\sigma$ from $\bar x$ — this lesson's two numbers, industrialized.

## Key takeaways

- Mean = balance point, sensitive to every value; median = middle by rank, robust to extremes.
- Deviations from the mean sum to zero; variance averages their squares, and $\sigma$ restores the units.
- Mean minimizes squared distance, median minimizes absolute distance — the L2/L1 loss split in disguise.
- Skewed data pulls the mean away from the median; when they disagree, ask which question you're really asking.
