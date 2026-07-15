"use client";

import ActivationFunctionsDemo from "./ActivationFunctionsDemo";
import AttentionDemo from "./AttentionDemo";
import DotProductDemo from "./DotProductDemo";
import GradientDescentDemo from "./GradientDescentDemo";
import LinearTransformDemo from "./LinearTransformDemo";
import MomentumDemo from "./MomentumDemo";
import NeuralNetworkDemo from "./NeuralNetworkDemo";
import SoftmaxDemo from "./SoftmaxDemo";
import TangentLineDemo from "./TangentLineDemo";
import VanishingGradientsDemo from "./VanishingGradientsDemo";

export const DEMO_NAMES = [
  "linear-transform",
  "dot-product",
  "activation-functions",
  "tangent-line",
  "gradient-descent",
  "momentum",
  "neural-network",
  "vanishing-gradients",
  "softmax",
  "attention",
] as const;

const DEMOS: Record<string, React.ComponentType> = {
  "linear-transform": LinearTransformDemo,
  "dot-product": DotProductDemo,
  "activation-functions": ActivationFunctionsDemo,
  "tangent-line": TangentLineDemo,
  "gradient-descent": GradientDescentDemo,
  momentum: MomentumDemo,
  "neural-network": NeuralNetworkDemo,
  "vanishing-gradients": VanishingGradientsDemo,
  softmax: SoftmaxDemo,
  attention: AttentionDemo,
};

export default function DemoBlock({
  name,
  mode = "live",
}: {
  name: string;
  mode?: "live" | "placeholder";
}) {
  const Demo = DEMOS[name];

  if (mode === "placeholder") {
    return (
      <div className="not-prose my-6 rounded-lg border border-dashed border-hairline bg-card p-4 text-sm text-ink-3">
        Interactive demo: <code className="font-mono">{name || "(unnamed)"}</code>{" "}
        — rendered live on the lesson page.
      </div>
    );
  }

  if (!Demo) {
    return (
      <div className="not-prose my-6 rounded-lg border border-dashed border-hairline bg-card p-4 text-sm text-ink-3">
        Unknown demo <code className="font-mono">{name}</code>. Available:{" "}
        {DEMO_NAMES.join(", ")}.
      </div>
    );
  }

  return <Demo />;
}
