export type LessonSummary = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  position: number;
  topic_id: number;
};

export type Lesson = LessonSummary & {
  content: string;
  created_at: string;
  updated_at: string;
};

export type Topic = {
  id: number;
  slug: string;
  title: string;
  description: string;
  position: number;
  lessons: LessonSummary[];
};

export type LessonInput = {
  title: string;
  topic_id: number;
  slug?: string;
  summary?: string;
  content?: string;
  position?: number;
};

export type GradientDescentParams = {
  surface: "bowl" | "saddle" | "rosenbrock";
  learning_rate: number;
  steps: number;
  start?: [number, number];
};

export type DescentRun = {
  path: [number, number][];
  losses: number[];
  diverged: boolean;
};

export type GradientDescentResult = DescentRun & {
  surface: string;
  xlim: [number, number];
  ylim: [number, number];
  grid: { xs: number[]; ys: number[]; z: number[][] };
};

export type MomentumParams = {
  surface: "bowl" | "saddle" | "rosenbrock";
  learning_rate: number;
  beta: number;
  steps: number;
};

export type MomentumResult = {
  surface: string;
  xlim: [number, number];
  ylim: [number, number];
  grid: { xs: number[]; ys: number[]; z: number[][] };
  vanilla: DescentRun;
  momentum: DescentRun;
};

export type GradientFlowParams = {
  depth: number;
  width: number;
  seed: number;
};

export type GradientFlowResult = {
  depth: number;
  width: number;
  layers: number[];
  norms: Record<"sigmoid" | "tanh" | "relu", number[]>;
};

export type TrainNetworkParams = {
  dataset: "xor" | "circles" | "moons" | "spiral";
  hidden_layers: number[];
  activation: "tanh" | "relu";
  learning_rate: number;
  epochs: number;
  seed: number;
};

export type TrainNetworkResult = {
  dataset: string;
  accuracy: number;
  loss_curve: { epoch: number; loss: number }[];
  points: [number, number, number][];
  boundary: { xs: number[]; ys: number[]; prob: number[][] };
  architecture: number[];
};
