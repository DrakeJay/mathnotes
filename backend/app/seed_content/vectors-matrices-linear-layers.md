Every neural network, no matter how large, is mostly built from one operation: multiplying a matrix by a vector. This lesson builds up that operation from scratch.

## Vectors are data

A **vector** is just an ordered list of numbers. In machine learning, vectors are how we represent *things*:

$$
\mathbf{x} = \begin{bmatrix} x_1 \\ x_2 \\ \vdots \\ x_n \end{bmatrix}
$$

A grayscale image becomes a vector of pixel brightnesses. A house becomes a vector like $[\text{sqft}, \text{bedrooms}, \text{age}]$. The number of entries $n$ is the **dimension** of the vector.

Geometrically, a vector is a point (or an arrow from the origin) in $n$-dimensional space. We can't picture $n = 784$, but every intuition we build in 2D carries over.

## The dot product is a weighted sum

The **dot product** of two vectors multiplies matching entries and adds them up:

$$
\mathbf{w} \cdot \mathbf{x} = \sum_{i=1}^{n} w_i x_i = w_1 x_1 + w_2 x_2 + \cdots + w_n x_n
$$

Two ways to read this, both important:

1. **As a weighted sum.** If $\mathbf{x}$ holds features and $\mathbf{w}$ holds *weights*, the dot product scores how much evidence the features provide. A spam filter might weight the word "FREE" positively and "meeting" negatively.
2. **As similarity.** Geometrically, $\mathbf{w} \cdot \mathbf{x} = \|\mathbf{w}\|\|\mathbf{x}\|\cos\theta$, where $\theta$ is the angle between the vectors. Aligned vectors give a large positive value; perpendicular ones give zero.

**A single artificial neuron is exactly this**: a dot product plus a constant offset called the **bias**:

$$
z = \mathbf{w} \cdot \mathbf{x} + b
$$

The neuron "fires" strongly when its input looks like its weight vector.

Feel this yourself — drag the two vectors and watch the dot product respond. It is largest when they align, zero when they are perpendicular, negative when they oppose:

<demo name="dot-product"></demo>

## Matrices apply many neurons at once

A **layer** of a neural network is many neurons looking at the same input. Stack each neuron's weight vector as a row of a matrix $W$, and all the dot products happen in one **matrix–vector product**:

$$
\mathbf{z} = W\mathbf{x} + \mathbf{b},
\qquad
z_j = \underbrace{\sum_i W_{ji} x_i}_{\text{neuron } j\text{'s dot product}} + \; b_j
$$

If the layer has $m$ neurons and the input has $n$ features, then $W$ is an $m \times n$ matrix, and it maps an $n$-dimensional vector to an $m$-dimensional one. **Keeping track of shapes like this is half of deep learning in practice.**

## A matrix is also a transformation of space

There is a second, more geometric way to see $W\mathbf{x}$: the matrix *moves every point in space* — rotating, stretching, shearing, or flipping it. The columns of $W$ tell you exactly where the basis vectors land.

Play with the matrix below and watch what it does to the plane:

<demo name="linear-transform"></demo>

Notice what a linear map *cannot* do: bend lines, or move the origin. Straight lines stay straight and evenly spaced. This is precisely why a neural network needs more than matrices...

## Why layers alone aren't enough

Compose two linear layers and you get... another linear layer:

$$
W_2(W_1\mathbf{x}) = (W_2 W_1)\mathbf{x}
$$

A hundred stacked linear layers collapse into one matrix. To gain expressive power, networks insert a simple **nonlinear function** between layers (like $\tanh$ or ReLU — covered in the next lesson). The pattern

$$
\mathbf{a} = \sigma(W\mathbf{x} + \mathbf{b})
$$

repeated a few times, is the entire architecture of a *multilayer perceptron*.

## Key takeaways

- Vectors represent data; dimension = number of features.
- A neuron computes a dot product plus bias: $z = \mathbf{w}\cdot\mathbf{x} + b$.
- A layer is a matrix–vector product: matrices are batched neurons *and* transformations of space.
- Linear maps compose into linear maps — nonlinearities between layers are what make depth useful.
