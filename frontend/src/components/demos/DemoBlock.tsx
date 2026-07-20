"use client";

import ActivationFunctionsDemo from "./ActivationFunctionsDemo";
import AttentionDemo from "./AttentionDemo";
import AttentionPipelineDiagram from "./AttentionPipelineDiagram";
import BinarySearchDemo from "./BinarySearchDemo";
import CallStackDemo from "./CallStackDemo";
import CoinFlipsDemo from "./CoinFlipsDemo";
import DerivativeGrapherDemo from "./DerivativeGrapherDemo";
import DescriptiveStatsDemo from "./DescriptiveStatsDemo";
import GaltonBoardDemo from "./GaltonBoardDemo";
import DotProductDemo from "./DotProductDemo";
import EqualTangentsDemo from "./EqualTangentsDemo";
import EuclideanDemo from "./EuclideanDemo";
import FibonacciDemo from "./FibonacciDemo";
import FiniteAutomataDemo from "./FiniteAutomataDemo";
import GradientDescentDemo from "./GradientDescentDemo";
import InscribedAngleDemo from "./InscribedAngleDemo";
import ThalesDemo from "./ThalesDemo";
import TransformerArchitectureDiagram from "./TransformerArchitectureDiagram";
import LinearTransformDemo from "./LinearTransformDemo";
import LogicGatesDemo from "./LogicGatesDemo";
import LSystemsDemo from "./LSystemsDemo";
import MomentumDemo from "./MomentumDemo";
import NetworkGameDemo from "./NetworkGameDemo";
import NeuralNetworkDemo from "./NeuralNetworkDemo";
import OrbitDemo from "./OrbitDemo";
import ProjectileDemo from "./ProjectileDemo";
import SoftmaxDemo from "./SoftmaxDemo";
import SortingRaceDemo from "./SortingRaceDemo";
import StackMachineDemo from "./StackMachineDemo";
import TangentLineDemo from "./TangentLineDemo";
import TurtlePlaygroundDemo from "./TurtlePlaygroundDemo";
import VanishingGradientsDemo from "./VanishingGradientsDemo";

export const DEMO_NAMES = [
  "linear-transform",
  "dot-product",
  "activation-functions",
  "tangent-line",
  "derivative-grapher",
  "gradient-descent",
  "momentum",
  "neural-network",
  "network-game",
  "vanishing-gradients",
  "softmax",
  "attention",
  "attention-pipeline",
  "transformer-architecture",
  "thales",
  "inscribed-angle",
  "equal-tangents",
  "finite-automata",
  "turtle-playground",
  "l-systems",
  "stack-machine",
  "call-stack",
  "logic-gates",
  "euclidean",
  "binary-search",
  "sorting-race",
  "fibonacci",
  "coin-flips",
  "galton-board",
  "descriptive-stats",
  "projectile-sim",
  "orbit-sim",
] as const;

const DEMOS: Record<string, React.ComponentType> = {
  "linear-transform": LinearTransformDemo,
  "dot-product": DotProductDemo,
  "activation-functions": ActivationFunctionsDemo,
  "tangent-line": TangentLineDemo,
  "derivative-grapher": DerivativeGrapherDemo,
  "gradient-descent": GradientDescentDemo,
  momentum: MomentumDemo,
  "neural-network": NeuralNetworkDemo,
  "network-game": NetworkGameDemo,
  "vanishing-gradients": VanishingGradientsDemo,
  softmax: SoftmaxDemo,
  attention: AttentionDemo,
  "attention-pipeline": AttentionPipelineDiagram,
  "transformer-architecture": TransformerArchitectureDiagram,
  thales: ThalesDemo,
  "inscribed-angle": InscribedAngleDemo,
  "equal-tangents": EqualTangentsDemo,
  "finite-automata": FiniteAutomataDemo,
  "turtle-playground": TurtlePlaygroundDemo,
  "l-systems": LSystemsDemo,
  "stack-machine": StackMachineDemo,
  "call-stack": CallStackDemo,
  "logic-gates": LogicGatesDemo,
  euclidean: EuclideanDemo,
  "binary-search": BinarySearchDemo,
  "sorting-race": SortingRaceDemo,
  fibonacci: FibonacciDemo,
  "coin-flips": CoinFlipsDemo,
  "galton-board": GaltonBoardDemo,
  "descriptive-stats": DescriptiveStatsDemo,
  "projectile-sim": ProjectileDemo,
  "orbit-sim": OrbitDemo,
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
