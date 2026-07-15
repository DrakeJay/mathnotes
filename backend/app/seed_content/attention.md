Transformers — the architecture behind GPT and essentially every modern language model — are built around one operation: **attention**. The remarkable thing is that you already know all of its ingredients. Attention is dot products (the linear algebra lesson) passed through a softmax (the last lesson). This lesson assembles them.

## The problem attention solves

A sentence arrives as a sequence of token vectors $\mathbf{x}_1, \dots, \mathbf{x}_L$. To understand "the robot picked up the ball", the vector for *picked* needs information from *robot* (who picked?) and *ball* (picked what?). Which tokens matter **depends on the content** — in another sentence, the important neighbors are elsewhere.

A fixed weight matrix can't do that: its mixing pattern is the same for every input. Attention's move is to let the tokens themselves compute the mixing weights, using similarity.

## Queries, keys, values

Each token vector is linearly projected three ways (three learned matrices — ordinary linear layers):

$$
\mathbf{q}_i = W_Q \mathbf{x}_i, \qquad
\mathbf{k}_i = W_K \mathbf{x}_i, \qquad
\mathbf{v}_i = W_V \mathbf{x}_i
$$

The names describe their jobs in a soft lookup:

- **Query** — what token $i$ is *looking for* ("I'm a verb; where are my nouns?")
- **Key** — what token $j$ *advertises about itself* ("I'm a noun")
- **Value** — the information token $j$ *hands over* if attended to

## Scores are dot products; weights are a softmax

How well does token $j$'s key match token $i$'s query? The dot product — the similarity measure from the first lesson:

$$
s_{ij} = \frac{\mathbf{q}_i \cdot \mathbf{k}_j}{\sqrt{d_k}}
$$

The $\sqrt{d_k}$ (dimension of the key vectors) is a temperature in disguise. In high dimensions, dot products of random vectors grow like $\sqrt{d_k}$, so unscaled scores would saturate the softmax — one token gets everything, gradients vanish (the chain-rule lesson's warning, again). Dividing by $\sqrt{d_k}$ keeps the distribution in its responsive range.

Each token then converts its row of scores into a probability distribution over the sequence — a softmax, exactly as in the last lesson:

$$
a_{ij} = \frac{e^{s_{ij}}}{\sum_{j'} e^{s_{ij'}}}
$$

$a_{ij}$ is **how much token $i$ attends to token $j$**. Row $i$ sums to $1$.

## The output is a weighted average of values

Token $i$'s new representation is the attention-weighted mix of everyone's values:

$$
\mathbf{out}_i = \sum_{j} a_{ij} \, \mathbf{v}_j
$$

Stack the vectors into matrices ($Q, K, V$ with one row per token) and the whole thing is one line — the most important equation in modern machine learning:

$$
\operatorname{Attention}(Q, K, V) = \operatorname{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
$$

Notice what it's made of: two matrix multiplications and a softmax. Nothing you haven't already met. Here is the whole computation as a pipeline — hover any stage:

<demo name="attention-pipeline"></demo>

## Causal masking: no peeking at the future

A language model predicts the *next* token, so token $i$ must not see tokens $j > i$. The fix is blunt: set those scores to $-\infty$ before the softmax, which turns their weights to exactly $0$ and renormalizes the rest. That triangular mask is the only difference between a text encoder's attention and GPT-style attention.

## Try it

A six-token sentence with hand-crafted 2D queries and keys (real models learn hundreds of dimensions; two are enough to see the machinery). Click a token, then **drag its query arrow** in the vector pane and watch its attention distribution follow the dot products. Toggle the causal mask; the matrix on the right is the full $\operatorname{softmax}(QK^\top)$:

<demo name="attention"></demo>

Things worth trying:

- Select **picked** — its query points at the *noun* keys, so its attention splits between **robot** and **ball**. Drag its query toward the function-word keys and watch the attention move to **the/up**.
- Turn on the **causal mask** while *picked* is selected — **ball** hasn't happened yet, so its share drops to zero and the rest renormalize.
- Push the **score scale** up (low temperature): attention snaps to one token. Pull it down: attention flattens toward uniform. That's the $\sqrt{d_k}$ story.
- Drag a query to be *orthogonal* to every key — attention goes uniform, because all dot products are equal.

## From attention to a transformer

One attention layer is rarely alone:

- **Multi-head attention.** Run $h$ small attentions in parallel, each with its own $W_Q, W_K, W_V$ — one head can track syntax while another tracks coreference — then concatenate the outputs.
- **The block.** A transformer block is attention followed by a small MLP (the two-layer networks from the backpropagation lesson), each wrapped with a residual connection and a normalization.
- **The model.** Embed tokens → stack $N$ blocks → a final linear layer + softmax over the vocabulary (the last lesson again) predicts the next token. GPT is this, repeated at scale, trained with cross-entropy by backpropagation and Adam-style gradient descent.

<demo name="transformer-architecture"></demo>

Every lesson in this course is a load-bearing part of that description.

## Key takeaways

- Attention builds *content-dependent* mixing weights: queries ask, keys advertise, values deliver.
- Scores are scaled dot products; weights are a per-row softmax; outputs are weighted averages of values.
- $\sqrt{d_k}$ is temperature control — it keeps the softmax out of its saturated, gradient-starved regime.
- The causal mask zeroes attention to future tokens; that's what makes it a language model.
- $\operatorname{softmax}(QK^\top/\sqrt{d_k})\,V$ — two matmuls and a softmax — is the core of every modern LLM.
