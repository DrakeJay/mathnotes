"use client";

import ActivationFunctionsDemo from "./ActivationFunctionsDemo";
import AttentionDemo from "./AttentionDemo";
import AttentionPipelineDiagram from "./AttentionPipelineDiagram";
import CallStackDemo from "./CallStackDemo";
import DotProductDemo from "./DotProductDemo";
import EqualTangentsDemo from "./EqualTangentsDemo";
import FiniteAutomataDemo from "./FiniteAutomataDemo";
import GradientDescentDemo from "./GradientDescentDemo";
import InscribedAngleDemo from "./InscribedAngleDemo";
import ThalesDemo from "./ThalesDemo";
import TransformerArchitectureDiagram from "./TransformerArchitectureDiagram";
import LinearTransformDemo from "./LinearTransformDemo";
import LogicGatesDemo from "./LogicGatesDemo";
import MomentumDemo from "./MomentumDemo";
import NeuralNetworkDemo from "./NeuralNetworkDemo";
import SoftmaxDemo from "./SoftmaxDemo";
import StackMachineDemo from "./StackMachineDemo";
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
  "attention-pipeline",
  "transformer-architecture",
  "thales",
  "inscribed-angle",
  "equal-tangents",
  "finite-automata",
  "stack-machine",
  "call-stack",
  "logic-gates",
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
  "attention-pipeline": AttentionPipelineDiagram,
  "transformer-architecture": TransformerArchitectureDiagram,
  thales: ThalesDemo,
  "inscribed-angle": InscribedAngleDemo,
  "equal-tangents": EqualTangentsDemo,
  "finite-automata": FiniteAutomataDemo,
  "stack-machine": StackMachineDemo,
  "call-stack": CallStackDemo,
  "logic-gates": LogicGatesDemo,
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
