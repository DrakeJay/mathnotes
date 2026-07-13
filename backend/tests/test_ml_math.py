"""Unit tests for the NumPy math itself — no HTTP involved."""

import numpy as np

from app.routers.ml import (
    ACTIVATIONS,
    SURFACES,
    bce_loss,
    make_dataset,
    mlp_backward,
    mlp_forward,
    mlp_init,
    run_descent,
)


def test_backprop_matches_finite_differences():
    """The canonical gradient check: analytic backprop gradients must agree
    with central finite differences of the loss, for every layer."""
    rng = np.random.default_rng(42)
    X, y = make_dataset("moons", rng, n=40)
    act, act_prime = ACTIVATIONS["tanh"]
    W, b = mlp_init([2, 5, 4, 1], "tanh", rng)

    activations, zs = mlp_forward(W, b, X, act)
    dWs, dbs = mlp_backward(W, activations, zs, y, act_prime)

    eps = 1e-6

    def loss_now() -> float:
        return bce_loss(mlp_forward(W, b, X, act)[0][-1], y)

    for layer in range(len(W)):
        rows, cols = W[layer].shape
        for i, j in [(0, 0), (rows - 1, cols - 1)]:
            original = W[layer][i, j]
            W[layer][i, j] = original + eps
            loss_plus = loss_now()
            W[layer][i, j] = original - eps
            loss_minus = loss_now()
            W[layer][i, j] = original
            numeric = (loss_plus - loss_minus) / (2 * eps)
            assert np.isclose(numeric, dWs[layer][i, j], rtol=1e-4, atol=1e-8), (
                f"W[{layer}][{i},{j}]: finite-diff {numeric} vs backprop {dWs[layer][i, j]}"
            )

        original = b[layer][0, 0]
        b[layer][0, 0] = original + eps
        loss_plus = loss_now()
        b[layer][0, 0] = original - eps
        loss_minus = loss_now()
        b[layer][0, 0] = original
        numeric = (loss_plus - loss_minus) / (2 * eps)
        assert np.isclose(numeric, dbs[layer][0, 0], rtol=1e-4, atol=1e-8)


def test_relu_backprop_also_checks_out():
    rng = np.random.default_rng(7)
    X, y = make_dataset("circles", rng, n=30)
    act, act_prime = ACTIVATIONS["relu"]
    W, b = mlp_init([2, 6, 1], "relu", rng)

    activations, zs = mlp_forward(W, b, X, act)
    dWs, _ = mlp_backward(W, activations, zs, y, act_prime)

    eps = 1e-6
    original = W[0][1, 1]
    W[0][1, 1] = original + eps
    loss_plus = bce_loss(mlp_forward(W, b, X, act)[0][-1], y)
    W[0][1, 1] = original - eps
    loss_minus = bce_loss(mlp_forward(W, b, X, act)[0][-1], y)
    W[0][1, 1] = original
    numeric = (loss_plus - loss_minus) / (2 * eps)
    assert np.isclose(numeric, dWs[0][1, 1], rtol=1e-4, atol=1e-8)


def test_bowl_convergence_threshold():
    """On L = 0.5x² + 1.5y², plain gradient descent is stable iff η < 2/3
    (the lesson's claim). Verify both sides of the threshold."""
    bowl = SURFACES["bowl"]
    converged = run_descent(bowl, 0.65, 200, bowl.default_start)
    assert not converged["diverged"]
    assert converged["losses"][-1] < 1e-3

    diverged = run_descent(bowl, 0.70, 500, bowl.default_start)
    assert diverged["diverged"]


def test_momentum_beats_vanilla_on_rosenbrock():
    surface = SURFACES["rosenbrock"]
    vanilla = run_descent(surface, 0.001, 300, surface.default_start)
    momentum = run_descent(surface, 0.001, 300, surface.default_start, beta=0.9)
    assert not momentum["diverged"]
    assert momentum["losses"][-1] < vanilla["losses"][-1] / 10


def test_gradient_at_surface_definitions():
    """Analytic gradients on the surfaces match finite differences of f."""
    eps = 1e-6
    for name, surface in SURFACES.items():
        x0, y0 = 0.7, -1.3
        gx, gy = surface.grad(x0, y0)
        fx = (surface.f(np.float64(x0 + eps), np.float64(y0)) - surface.f(np.float64(x0 - eps), np.float64(y0))) / (2 * eps)
        fy = (surface.f(np.float64(x0), np.float64(y0 + eps)) - surface.f(np.float64(x0), np.float64(y0 - eps))) / (2 * eps)
        assert np.isclose(gx, fx, rtol=1e-4), name
        assert np.isclose(gy, fy, rtol=1e-4), name


def test_datasets_are_balanced_and_bounded():
    rng = np.random.default_rng(0)
    for name in ("xor", "circles", "moons", "spiral"):
        X, y = make_dataset(name, rng)
        assert X.shape[0] == y.shape[0]
        assert set(np.unique(y)) <= {0.0, 1.0}
        assert 0.3 < y.mean() < 0.7, f"{name} is unbalanced"
        assert np.abs(X).max() < 2.0, f"{name} exceeds plot bounds"
