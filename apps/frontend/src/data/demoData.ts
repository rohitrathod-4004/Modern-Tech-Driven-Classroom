export const DEMO_CHUNKS = [
  { chunk_index: 0, text: "Welcome to today's lecture on artificial intelligence. ", status: "synced" as const },
  { chunk_index: 1, text: "We will be discussing how modern neural networks are trained using backpropagation. ", status: "synced" as const },
  { chunk_index: 2, text: "It is important to understand that backpropagation uses the chain rule of calculus ", status: "synced" as const },
  { chunk_index: 3, text: "to compute gradients of the loss function with respect to the weights. ", status: "synced" as const },
  { chunk_index: 4, text: "This allows the optimizer, like Adam or SGD, to minimize the loss. ", status: "synced" as const },
  { chunk_index: 5, text: "Please review chapter 4 before our next class, and make sure your environment is setup.", status: "synced" as const }
];

export const DEMO_SUMMARY = {
  summary: "This lecture introduces the foundational concepts of artificial intelligence, focusing heavily on how modern neural networks learn. The core mechanism discussed is backpropagation, which leverages calculus to adjust network weights and minimize errors during training.",
  topics: [
    "Artificial Intelligence",
    "Neural Networks",
    "Backpropagation",
    "Calculus Chain Rule",
    "Loss Optimization"
  ],
  key_points: [
    "Neural networks are trained using a method called backpropagation.",
    "Backpropagation applies the chain rule of calculus to compute gradients.",
    "Gradients tell the network how to adjust weights to reduce the loss function.",
    "Optimizers like Adam and SGD (Stochastic Gradient Descent) apply these gradients."
  ],
  study_notes: [
    "Review the Chain Rule from calculus—it's essential for understanding backpropagation.",
    "Loss Function = the error we are trying to minimize.",
    "Optimizer = the algorithm (e.g., Adam, SGD) that updates the weights."
  ],
  action_items: [
    "Read Chapter 4 of the textbook.",
    "Set up your local coding environment for the next practical session."
  ]
};
