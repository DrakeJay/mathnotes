"""Live math demos: everything here is computed with plain NumPy so the
lessons can point at real, readable implementations of the algorithms."""

from typing import Callable, Literal

import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/ml", tags=["ml"])

# ---------------------------------------------------------------------------
# Gradient descent on 2D surfaces
# ---------------------------------------------------------------------------


class Surface(BaseModel):
    f: Callable[[np.ndarray, np.ndarray], np.ndarray]
    grad: Callable[[float, float], tuple[float, float]]
    xlim: tuple[float, float]
    ylim: tuple[float, float]
    default_start: tuple[float, float]

    model_config = {"arbitrary_types_allowed": True}


SURFACES: dict[str, Surface] = {
    # Elongated bowl: curvature is 3x stronger along y, so a too-large step
    # size zig-zags across the valley before it diverges.
    "bowl": Surface(
        f=lambda x, y: 0.5 * x**2 + 1.5 * y**2,
        grad=lambda x, y: (x, 3.0 * y),
        xlim=(-4, 4),
        ylim=(-4, 4),
        default_start=(-3.4, 2.6),
    ),
    # Saddle point at the origin: descent stalls near it, then escapes along y.
    "saddle": Surface(
        f=lambda x, y: 0.5 * (x**2 - y**2),
        grad=lambda x, y: (x, -y),
        xlim=(-4, 4),
        ylim=(-4, 4),
        default_start=(-3.5, 0.08),
    ),
    # Rosenbrock "banana" valley: easy to reach the valley floor, very hard
    # to travel along it to the minimum at (1, 1).
    "rosenbrock": Surface(
        f=lambda x, y: (1 - x) ** 2 + 100 * (y - x**2) ** 2,
        grad=lambda x, y: (
            -2 * (1 - x) - 400 * x * (y - x**2),
            200 * (y - x**2),
        ),
        xlim=(-2, 2),
        ylim=(-1, 3),
        default_start=(-1.6, 2.4),
    ),
}

GRID_RESOLUTION = 61
DIVERGENCE_LIMIT = 1e6


def run_descent(
    surface: Surface,
    learning_rate: float,
    steps: int,
    start: tuple[float, float],
    beta: float = 0.0,
) -> dict:
    """Gradient descent with heavy-ball momentum (beta=0 is plain descent):
    v <- beta*v + grad,  theta <- theta - lr*v."""
    x, y = start
    vx = vy = 0.0
    path = [[x, y]]
    losses = [float(surface.f(np.float64(x), np.float64(y)))]
    diverged = False
    for _ in range(steps):
        gx, gy = surface.grad(x, y)
        vx, vy = beta * vx + gx, beta * vy + gy
        x, y = x - learning_rate * vx, y - learning_rate * vy
        if not (np.isfinite(x) and np.isfinite(y)) or abs(x) > DIVERGENCE_LIMIT or abs(y) > DIVERGENCE_LIMIT:
            diverged = True
            break
        path.append([float(x), float(y)])
        losses.append(float(surface.f(np.float64(x), np.float64(y))))
    return {"path": path, "losses": losses, "diverged": diverged}


def surface_grid(surface: Surface) -> dict:
    xs = np.linspace(*surface.xlim, GRID_RESOLUTION)
    ys = np.linspace(*surface.ylim, GRID_RESOLUTION)
    xx, yy = np.meshgrid(xs, ys)
    return {"xs": xs.tolist(), "ys": ys.tolist(), "z": surface.f(xx, yy).tolist()}


class GradientDescentRequest(BaseModel):
    surface: Literal["bowl", "saddle", "rosenbrock"] = "bowl"
    learning_rate: float = Field(default=0.1, gt=0, le=2)
    steps: int = Field(default=60, ge=1, le=500)
    start: tuple[float, float] | None = None


@router.post("/gradient-descent")
def gradient_descent(body: GradientDescentRequest):
    surface = SURFACES[body.surface]
    start = body.start if body.start is not None else surface.default_start
    run = run_descent(surface, body.learning_rate, body.steps, start)
    return {
        "surface": body.surface,
        "xlim": surface.xlim,
        "ylim": surface.ylim,
        "grid": surface_grid(surface),
        **run,
    }


class MomentumRequest(BaseModel):
    surface: Literal["bowl", "saddle", "rosenbrock"] = "bowl"
    learning_rate: float = Field(default=0.1, gt=0, le=2)
    beta: float = Field(default=0.9, ge=0, le=0.99)
    steps: int = Field(default=80, ge=1, le=500)
    start: tuple[float, float] | None = None


@router.post("/momentum")
def momentum(body: MomentumRequest):
    """Plain gradient descent and heavy-ball momentum on the same surface,
    from the same start, so the two trajectories can be compared directly."""
    surface = SURFACES[body.surface]
    start = body.start if body.start is not None else surface.default_start
    return {
        "surface": body.surface,
        "xlim": surface.xlim,
        "ylim": surface.ylim,
        "grid": surface_grid(surface),
        "vanilla": run_descent(surface, body.learning_rate, body.steps, start),
        "momentum": run_descent(surface, body.learning_rate, body.steps, start, beta=body.beta),
    }


# ---------------------------------------------------------------------------
# Toy datasets for the neural-network demo
# ---------------------------------------------------------------------------


def make_dataset(name: str, rng: np.random.Generator, n: int = 220):
    half = n // 2
    if name == "xor":
        X = rng.uniform(-1, 1, size=(n, 2))
        y = (X[:, 0] * X[:, 1] > 0).astype(np.float64)
    elif name == "circles":
        angles = rng.uniform(0, 2 * np.pi, size=n)
        radii = np.concatenate(
            [rng.normal(0.35, 0.07, half), rng.normal(0.95, 0.07, n - half)]
        )
        X = np.column_stack([radii * np.cos(angles), radii * np.sin(angles)])
        y = np.concatenate([np.ones(half), np.zeros(n - half)])
    elif name == "moons":
        t = rng.uniform(0, np.pi, size=half)
        upper = np.column_stack([np.cos(t), np.sin(t)])
        lower = np.column_stack([1 - np.cos(t), -np.sin(t) + 0.5])
        X = np.vstack([upper, lower[: n - half]])
        X = (X - X.mean(axis=0)) / 1.5 + rng.normal(0, 0.06, size=(n, 2))
        y = np.concatenate([np.ones(half), np.zeros(n - half)])
    else:  # spiral
        t = np.sqrt(rng.uniform(0.05, 1, size=half))
        X_parts, y_parts = [], []
        for arm in (0, 1):
            theta = t * 3 * np.pi + arm * np.pi + rng.normal(0, 0.12, half)
            r = t * 1.1
            X_parts.append(np.column_stack([r * np.cos(theta), r * np.sin(theta)]))
            y_parts.append(np.full(half, float(arm)))
        X = np.vstack(X_parts)
        y = np.concatenate(y_parts)
    return X, y.reshape(-1, 1)


# ---------------------------------------------------------------------------
# A multilayer perceptron trained with backprop, written out longhand
# ---------------------------------------------------------------------------

ACTIVATIONS = {
    "tanh": (np.tanh, lambda z: 1 - np.tanh(z) ** 2),
    "relu": (lambda z: np.maximum(0, z), lambda z: (z > 0).astype(np.float64)),
}

BOUNDARY_RESOLUTION = 45


class TrainRequest(BaseModel):
    dataset: Literal["xor", "circles", "moons", "spiral"] = "circles"
    hidden_layers: list[int] = Field(default=[8], min_length=1, max_length=3)
    activation: Literal["tanh", "relu"] = "tanh"
    learning_rate: float = Field(default=0.5, gt=0, le=3)
    epochs: int = Field(default=400, ge=10, le=2000)
    seed: int = Field(default=0, ge=0, le=10_000)


def sigmoid(z: np.ndarray) -> np.ndarray:
    return 1 / (1 + np.exp(-np.clip(z, -30, 30)))


def mlp_init(sizes: list[int], activation: str, rng: np.random.Generator):
    """He initialization for ReLU, Xavier for the rest."""
    gain = 2.0 if activation == "relu" else 1.0
    W = [
        rng.normal(0, np.sqrt(gain / sizes[i]), (sizes[i], sizes[i + 1]))
        for i in range(len(sizes) - 1)
    ]
    b = [np.zeros((1, sizes[i + 1])) for i in range(len(sizes) - 1)]
    return W, b


def mlp_forward(W, b, X: np.ndarray, act):
    """Forward pass, caching every pre-activation z and activation a
    because backprop needs them. Hidden layers use `act`, output sigmoid."""
    activations, zs = [X], []
    a = X
    for layer in range(len(W)):
        z = a @ W[layer] + b[layer]
        zs.append(z)
        a = sigmoid(z) if layer == len(W) - 1 else act(z)
        activations.append(a)
    return activations, zs


def bce_loss(p: np.ndarray, y: np.ndarray) -> float:
    eps = 1e-9
    return float(-np.mean(y * np.log(p + eps) + (1 - y) * np.log(1 - p + eps)))


def mlp_backward(W, activations, zs, y: np.ndarray, act_prime):
    """Backprop. For sigmoid + cross-entropy the output error simplifies to
    (p - y); each earlier layer applies the chain rule. Returns per-layer
    weight and bias gradients."""
    n = y.shape[0]
    L = len(W)
    dWs: list[np.ndarray | None] = [None] * L
    dbs: list[np.ndarray | None] = [None] * L
    delta = (activations[-1] - y) / n
    for layer in range(L - 1, -1, -1):
        dWs[layer] = activations[layer].T @ delta
        dbs[layer] = delta.sum(axis=0, keepdims=True)
        if layer > 0:
            delta = (delta @ W[layer].T) * act_prime(zs[layer - 1])
    return dWs, dbs


@router.post("/train-network")
def train_network(body: TrainRequest):
    hidden = [max(1, min(16, h)) for h in body.hidden_layers]
    act, act_prime = ACTIVATIONS[body.activation]
    rng = np.random.default_rng(body.seed)

    X, y = make_dataset(body.dataset, rng)

    sizes = [2, *hidden, 1]
    W, b = mlp_init(sizes, body.activation, rng)
    L = len(W)

    loss_curve = []
    for epoch in range(body.epochs):
        activations, zs = mlp_forward(W, b, X, act)
        loss_curve.append(bce_loss(activations[-1], y))
        dWs, dbs = mlp_backward(W, activations, zs, y, act_prime)
        for layer in range(L):
            W[layer] -= body.learning_rate * dWs[layer]
            b[layer] -= body.learning_rate * dbs[layer]

    def predict(points: np.ndarray) -> np.ndarray:
        activations, _ = mlp_forward(W, b, points, act)
        return activations[-1]

    accuracy = float(np.mean((predict(X) > 0.5) == (y > 0.5)))

    lim = 1.5 if body.dataset != "xor" else 1.2
    xs = np.linspace(-lim, lim, BOUNDARY_RESOLUTION)
    ys = np.linspace(-lim, lim, BOUNDARY_RESOLUTION)
    xx, yy = np.meshgrid(xs, ys)
    probs = predict(np.column_stack([xx.ravel(), yy.ravel()])).reshape(xx.shape)

    # Sample the loss curve down to <=120 points for the chart.
    stride = max(1, len(loss_curve) // 120)
    sampled = [
        {"epoch": i, "loss": loss_curve[i]} for i in range(0, len(loss_curve), stride)
    ]
    if sampled[-1]["epoch"] != len(loss_curve) - 1:
        sampled.append({"epoch": len(loss_curve) - 1, "loss": loss_curve[-1]})

    return {
        "dataset": body.dataset,
        "accuracy": accuracy,
        "loss_curve": sampled,
        "points": [[float(px), float(py), int(label)] for (px, py), label in zip(X, y.ravel())],
        "boundary": {"xs": xs.tolist(), "ys": ys.tolist(), "prob": probs.tolist()},
        "architecture": sizes,
    }


# ---------------------------------------------------------------------------
# Gradient flow through depth: the vanishing-gradient effect, measured
# ---------------------------------------------------------------------------

FLOW_ACTIVATIONS = {
    "sigmoid": (sigmoid, lambda z: sigmoid(z) * (1 - sigmoid(z))),
    **ACTIVATIONS,
}


class GradientFlowRequest(BaseModel):
    depth: int = Field(default=6, ge=2, le=10)
    width: int = Field(default=8, ge=2, le=32)
    seed: int = Field(default=0, ge=0, le=10_000)


@router.post("/gradient-flow")
def gradient_flow(body: GradientFlowRequest):
    """One forward+backward pass through a freshly initialized deep MLP, for
    each activation, recording the mean |dL/dW| at every layer. Shows how the
    chain rule's repeated multiplication by the activation slope shrinks (or
    preserves) the gradient as it travels backward."""
    norms: dict[str, list[float]] = {}
    for name, (act, act_prime) in FLOW_ACTIVATIONS.items():
        rng = np.random.default_rng(body.seed)  # same data/weights per activation
        X, y = make_dataset("circles", rng, n=128)

        sizes = [2, *([body.width] * body.depth), 1]
        W, b = mlp_init(sizes, name, rng)
        activations, zs = mlp_forward(W, b, X, act)
        dWs, _ = mlp_backward(W, activations, zs, y, act_prime)
        norms[name] = [float(np.mean(np.abs(dW))) for dW in dWs]

    return {
        "depth": body.depth,
        "width": body.width,
        "layers": list(range(1, body.depth + 2)),  # hidden layers + output layer
        "norms": norms,
    }
