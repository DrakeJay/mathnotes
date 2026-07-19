import { expect, test } from "@playwright/test";

test("ML lessons render highlighted Python code examples", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await page.goto("/lessons/backpropagation");
  const code = page.locator("code.hljs.language-python").first();
  await expect(code).toBeVisible();
  await expect(code).toContainText("delta = (activations[-1] - y) / n");
  // Tokens actually got colored, not just wrapped.
  await expect(code.locator(".hljs-keyword").first()).toBeVisible();

  await page.goto("/lessons/attention");
  await expect(page.locator("code.hljs.language-python").first()).toContainText(
    "def attention(Q, K, V",
  );

  expect(pageErrors).toEqual([]);
});

test("lesson page renders KaTeX math and a live server-computed demo", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await page.goto("/lessons/gradient-descent");
  await expect(
    page.getByRole("heading", { name: "Gradient Descent", level: 1 }),
  ).toBeVisible();
  await expect(page.locator(".katex").first()).toBeVisible();

  // Both server-computed demos on this page fetch and render their charts
  // (each shows a "Loss at each step" caption once its data arrives).
  await expect(page.getByText("Gradient descent, live")).toBeVisible();
  await expect(page.getByText("Plain gradient descent vs. momentum")).toBeVisible();
  await expect(page.getByText("Loss at each step")).toHaveCount(2, {
    timeout: 10_000,
  });
  await expect(page.getByText(/final loss/).first()).toBeVisible();

  expect(pageErrors).toEqual([]);
});

test("softmax lesson renders its client-side demo", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await page.goto("/lessons/softmax-cross-entropy");
  await expect(
    page.getByRole("heading", { name: "Softmax and Cross-Entropy", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Softmax: logits → probabilities")).toBeVisible();
  // Default logits [2, 0.5, -1, -3] at T=1: class 1 dominates.
  await expect(page.getByText(/Cross-entropy L = −ln p/)).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("attention lesson renders its interactive demo", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await page.goto("/lessons/attention");
  await expect(
    page.getByRole("heading", { name: "Attention: The Math Behind Transformers", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Scaled dot-product attention, hands on")).toBeVisible();
  // Default selection is "picked"; the causal mask hides future tokens.
  await page.getByText("causal mask (no peeking at the future)").click();
  await expect(page.getByText(/uniform over 3 visible tokens/)).toBeVisible();
  // The two architecture diagrams render too.
  await expect(page.getByText("Inside one attention layer")).toBeVisible();
  await expect(page.getByText("The transformer, assembled")).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("geometry lessons render their draggable constructions", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await page.goto("/lessons/thales-theorem");
  await expect(page.getByRole("heading", { name: "Thales' Theorem", level: 1 })).toBeVisible();
  // Wherever C sits, the demo must report a right angle.
  await expect(page.getByText(/∠ACB = α \+ β = 90\.0°/)).toBeVisible();

  await page.goto("/lessons/inscribed-angle-theorem");
  await expect(page.getByText(/ratio = 2\.00/)).toBeVisible();

  await page.goto("/lessons/equal-tangent-theorem");
  await expect(page.getByText(/\|PT₁\| = \|PT₂\|/)).toBeVisible();

  expect(pageErrors).toEqual([]);
});

test("finite automata demo steps to a verdict", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await page.goto("/lessons/finite-automata");
  await expect(page.getByRole("heading", { name: "Finite Automata", level: 1 })).toBeVisible();
  // Default machine: divisible-by-3, sample input 1001 (= 9, accepted).
  await expect(page.getByText(/remainder 0/)).toBeVisible();
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: "Step", exact: true }).click();
  }
  await expect(page.getByText("✓ accepted")).toBeVisible();
  await expect(page.getByText(/read 1001₂ = 9/)).toBeVisible();

  expect(pageErrors).toEqual([]);
});

test("stack machine steps brackets to balanced and computes RPN", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await page.goto("/lessons/stacks");
  await expect(page.getByRole("heading", { name: "Stacks", level: 1 })).toBeVisible();
  // Default machine: balanced brackets, sample ([{}]()) — 8 steps to balanced.
  for (let i = 0; i < 8; i++) {
    await page.getByRole("button", { name: "Step", exact: true }).click();
  }
  await expect(page.getByText("✓ balanced")).toBeVisible();

  // RPN machine: 3 4 + 2 *  →  14.
  await page.locator("select").last().selectOption("2");
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByText("(one value left: the result)")).toBeVisible({
    timeout: 10_000,
  });

  expect(pageErrors).toEqual([]);
});

test("call-stack demo runs factorial and overflows on infinite recursion", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await page.goto("/lessons/stack-in-memory");
  await expect(page.getByRole("heading", { name: "The Stack in Memory", level: 1 })).toBeVisible();
  // factorial(4): 4 pushes + 4 pops = 8 steps to the result.
  for (let i = 0; i < 8; i++) {
    await page.getByRole("button", { name: "Step", exact: true }).click();
  }
  await expect(page.getByText("✓ factorial(4) = 24")).toBeVisible();

  // Infinite recursion hits the limit.
  await page.locator("select").last().selectOption("2");
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByText("✗ STACK OVERFLOW")).toBeVisible({ timeout: 10_000 });

  expect(pageErrors).toEqual([]);
});

test("logic gates demo computes AND and adds with the half adder", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await page.goto("/lessons/logic-gates");
  await expect(page.getByRole("heading", { name: "Logic Gates", level: 1 })).toBeVisible();
  // One gate (AND): flip both switches — 1 ∧ 1 = 1.
  await expect(page.getByText("0 ∧ 0 = 0")).toBeVisible();
  await page.getByRole("switch", { name: "input A" }).click();
  await page.getByRole("switch", { name: "input B" }).click();
  await expect(page.getByText("1 ∧ 1 = 1")).toBeVisible();

  // Half adder: 1 + 1 = 10₂.
  await page.locator("select").last().selectOption("2");
  await page.getByRole("switch", { name: "input A" }).click();
  await page.getByRole("switch", { name: "input B" }).click();
  await expect(page.getByText(/1 \+ 1 = 10₂/)).toBeVisible();

  expect(pageErrors).toEqual([]);
});

test("euclidean demo tiles the rectangle down to the gcd", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await page.goto("/lessons/euclidean-algorithm");
  await expect(
    page.getByRole("heading", { name: "The Euclidean Algorithm", level: 1 }),
  ).toBeVisible();
  // Default 252 × 105: three division steps to gcd 21.
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Step", exact: true }).click();
  }
  await expect(page.getByText(/21 in 3 step\(s\)/)).toBeVisible();
  await expect(page.getByText(/Bézout: 252·\(-2\) \+ 105·5 = 21/)).toBeVisible();

  expect(pageErrors).toEqual([]);
});

test("search race: binary beats linear on the same target", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await page.goto("/lessons/search-algorithms");
  await expect(page.getByRole("heading", { name: "Search Algorithms", level: 1 })).toBeVisible();
  // Default target 58 lives at index 18: linear needs 19 probes, binary 3.
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(
    page.getByText(/found 58 at index 18 — linear: 19 comparison\(s\), binary: 3/),
  ).toBeVisible({ timeout: 15_000 });

  expect(pageErrors).toEqual([]);
});

test("fibonacci demo shows the waste and memoization removes it", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await page.goto("/lessons/fibonacci");
  await expect(page.getByRole("heading", { name: "Fibonacci Numbers", level: 1 })).toBeVisible();
  // n = 6 naive: 25 calls, 7 distinct.
  await expect(page.getByText(/naive recursion: 25 calls, but only 7 distinct/)).toBeVisible();
  await page.getByText("memoize (cache every result)").click();
  await expect(page.getByText(/memoized: 7 computations \+ 4 cache hits/)).toBeVisible();

  expect(pageErrors).toEqual([]);
});

test("probability lesson: coin flips converge, Galton board fills", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await page.goto("/lessons/probability");
  await expect(
    page.getByRole("heading", { name: "Probability and the Law of Large Numbers", level: 1 }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Flip 5,000" }).click();
  await expect(page.getByText(/n = 5,000/)).toBeVisible();

  await page.getByRole("button", { name: "Drop 200" }).click();
  await expect(page.getByText(/200 ball\(s\)/)).toBeVisible();

  expect(pageErrors).toEqual([]);
});

test("statistics demo: the billionaire pulls the mean but not the median", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await page.goto("/lessons/descriptive-statistics");
  await expect(
    page.getByRole("heading", { name: "Mean, Median, and Spread", level: 1 }),
  ).toBeVisible();
  // Symmetric default: mean and median both 50.
  await expect(page.getByText(/mean and median agree/)).toBeVisible();
  // The billionaire preset: mean 29.4 vs median 21.
  await page.locator("select").last().selectOption("Outlier (the billionaire)");
  await expect(page.getByText(/mean = 29\.4/)).toBeVisible();
  await expect(page.getByText(/median = 21\.0/)).toBeVisible();
  await expect(page.getByText(/pulled by the right tail/)).toBeVisible();

  expect(pageErrors).toEqual([]);
});

test("physics lesson: projectile matches the formula, orbit reports energy", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await page.goto("/lessons/simulating-motion");
  await expect(page.getByRole("heading", { name: "Simulating Motion", level: 1 })).toBeVisible();
  // Default launch: v0 = 25 m/s at 45 degrees, no drag -> range 63.8 m.
  await expect(page.getByText(/analytic no-drag range v₀²sin2θ\/g = 63\.8 m/)).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText(/range 63\.[0-9] m/)).toBeVisible({ timeout: 10_000 });

  // The orbit sim runs and reports energy; switch integrators.
  await expect(page.getByText(/specific energy E =/)).toBeVisible();
  await page.locator("select").last().selectOption("symplectic");
  await expect(page.getByText(/the orbit stays closed/)).toBeVisible({ timeout: 10_000 });

  expect(pageErrors).toEqual([]);
});

test("home page groups the curriculum and showcases projects", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Math, made interactive" }),
  ).toBeVisible();
  // The three curriculum groups plus the projects section.
  for (const name of ["Machine Learning", "Computing", "Mathematics", "Projects"]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: /Backpropagation/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /LameChat/ })).toHaveAttribute(
    "href",
    "https://github.com/drakejay/LameChat",
  );
  await expect(page.getByText(/lessons across .* topics/)).toBeVisible();
});

test("about page introduces Drake with GitHub and LinkedIn links", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: "About", level: 1 })).toBeVisible();
  await expect(page.getByText(/Drake Weller/).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /GitHub/ })).toHaveAttribute(
    "href",
    "https://github.com/drakejay",
  );
  await expect(page.getByRole("link", { name: /LinkedIn/ })).toHaveAttribute(
    "href",
    "https://linkedin.com/in/drakeweller222",
  );
});

test("network game: a nudge lowers the loss, gradient descent beats par", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await page.goto("/lessons/neural-network-game");
  await expect(
    page.getByRole("heading", { name: "The Neural Network Game", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Beat par: train a network by hand")).toBeVisible();

  // Level 1 always starts from the same weights, so the loss is deterministic.
  const loss = page.getByLabel("current loss");
  await expect(loss).toHaveText(/1\.396/);

  await page.getByRole("button", { name: "Nudge downhill" }).click();
  await expect(page.getByLabel("gradient steps")).toHaveText(/gradient steps 1/);
  const after = parseFloat((await loss.textContent())!.replace(/[^0-9.]/g, ""));
  expect(after).toBeLessThan(1.396);

  // The machine plays 400 animated steps and lands well under par.
  await page.getByRole("button", { name: "Let gradient descent play" }).click();
  await expect(page.getByText("Solved!")).toBeVisible({ timeout: 15_000 });

  // Level 2 is XOR: fresh deterministic weights, nine coupled sliders.
  await page.getByRole("button", { name: "2 · XOR" }).click();
  await expect(loss).toHaveText(/0\.688/);
  await expect(page.getByRole("slider")).toHaveCount(9);

  expect(pageErrors).toEqual([]);
});
