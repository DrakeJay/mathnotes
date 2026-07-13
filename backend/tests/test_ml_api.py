"""The ML demo endpoints through HTTP: shapes, behavior, validation."""


def test_gradient_descent_converges_and_diverges(client):
    ok = client.post(
        "/api/ml/gradient-descent",
        json={"surface": "bowl", "learning_rate": 0.3, "steps": 100},
    ).json()
    assert not ok["diverged"]
    assert ok["losses"][-1] < 1e-4
    assert len(ok["path"]) == 101
    assert len(ok["grid"]["z"]) == len(ok["grid"]["ys"])

    boom = client.post(
        "/api/ml/gradient-descent",
        json={"surface": "bowl", "learning_rate": 0.9, "steps": 300},
    ).json()
    assert boom["diverged"]


def test_momentum_endpoint_returns_both_runs(client):
    res = client.post(
        "/api/ml/momentum",
        json={"surface": "rosenbrock", "learning_rate": 0.001, "beta": 0.9, "steps": 300},
    ).json()
    assert res["momentum"]["losses"][-1] < res["vanilla"]["losses"][-1]
    assert res["vanilla"]["path"][0] == res["momentum"]["path"][0]


def test_train_network_learns_circles(client):
    res = client.post(
        "/api/ml/train-network",
        json={"dataset": "circles", "hidden_layers": [8], "epochs": 400},
    ).json()
    assert res["accuracy"] >= 0.95
    assert res["loss_curve"][-1]["loss"] < res["loss_curve"][0]["loss"] / 2
    assert res["architecture"] == [2, 8, 1]
    grid = res["boundary"]
    assert len(grid["prob"]) == len(grid["ys"])
    assert all(0.0 <= p <= 1.0 for row in grid["prob"] for p in row)


def test_gradient_flow_shows_vanishing_sigmoid(client):
    res = client.post("/api/ml/gradient-flow", json={"depth": 8, "width": 8}).json()
    assert set(res["norms"]) == {"sigmoid", "tanh", "relu"}
    for norms in res["norms"].values():
        assert len(norms) == res["depth"] + 1
    # Sigmoid's first-layer gradient collapses relative to relu's.
    assert res["norms"]["sigmoid"][0] < res["norms"]["relu"][0] / 100


def test_request_validation_limits(client):
    assert (
        client.post(
            "/api/ml/train-network", json={"dataset": "circles", "epochs": 999999}
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/ml/gradient-descent", json={"learning_rate": -1}
        ).status_code
        == 422
    )
