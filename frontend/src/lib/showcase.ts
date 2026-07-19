/* Curated GitHub showcase for the home page. Repo names verified against
   github.com/drakejay — update blurbs here, not on GitHub. */

export type Project = {
  name: string;
  href: string;
  blurb: string;
  tech: string;
};

export const PROJECTS: Project[] = [
  {
    name: "LameChat",
    href: "https://github.com/drakejay/LameChat",
    blurb:
      "A character-level GPT built from scratch — multi-head self-attention and a 24-layer decoder-only transformer, served with temperature controls. The attention lesson here is its math.",
    tech: "PyTorch",
  },
  {
    name: "Neural-Network",
    href: "https://github.com/drakejay/Neural-Network",
    blurb:
      "A neural network in plain C with arena allocation — backpropagation with no frameworks at all. The backprop lesson's four equations, hand-managed memory included.",
    tech: "C",
  },
  {
    name: "Kardia",
    href: "https://github.com/drakejay/kardia",
    blurb:
      "An ECG digitization pipeline: U-Net segmentation turning scanned 12-lead paper ECGs into time-series signals on the 86 GB PhysioNet 2024 dataset.",
    tech: "PyTorch · U-Net",
  },
  {
    name: "DNN ablation study",
    href: "https://github.com/drakejay/DNN_CMIST",
    blurb:
      "A deep network for CIFAR-10 with a systematic ablation study — measuring what architecture choices and hyperparameters actually buy.",
    tech: "PyTorch",
  },
  {
    name: "CUDA matrix project",
    href: "https://github.com/drakejay/Cuda_Matrix_Proj",
    blurb:
      "Matrix multiplication on the GPU — the linear algebra lesson's core operation, written for the hardware that makes deep learning fast.",
    tech: "CUDA",
  },
  {
    name: "MathNotes",
    href: "https://github.com/DrakeJay/mathnotes",
    blurb:
      "This site — interactive lessons with draggable proofs and live NumPy training demos, tested and deployed end to end. You are here.",
    tech: "Next.js · FastAPI",
  },
];
