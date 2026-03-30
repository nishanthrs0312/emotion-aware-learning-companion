export const LESSONS = {
  Engaged: {
    title: "Binary Search Trees — Core Concept",
    body: "A BST organises data so every left child is smaller than its parent and every right child is larger. Search, insert, and delete all run in O(log n) on a balanced tree.",
    difficulty: "medium", 
    pace: 70, 
    hints: [],
    badge: "bg-indigo-100 text-indigo-700", 
    emoji: "😊"
  },
  Confused: {
    title: "Let's slow down — BST Search simplified",
    body: "Think of BST as a higher-or-lower game. Start at the top node. Target smaller? Go left. Larger? Go right. Repeat until you find it.",
    difficulty: "easy", 
    pace: 35,
    hints: ["What is a node?", "Show me a diagram", "Give an example"],
    badge: "bg-amber-100 text-amber-700", 
    emoji: "😕"
  },
  Stressed: {
    title: "Take a breath — you are doing great",
    body: "It is completely normal to find this tricky. Let us pause new material. Here is what you have already mastered: arrays, loops, functions. You have got this.",
    difficulty: "easy", 
    pace: 15,
    hints: ["Review arrays first", "Take a 2-min break", "Try easier problem"],
    badge: "bg-pink-100 text-pink-700", 
    emoji: "😰"
  },
  Frustrated: {
    title: "Let us try a different approach",
    body: "Sometimes a fresh angle helps. Instead of theory, let us build something. We will insert 5 numbers into a BST step by step and you will see exactly how it works.",
    difficulty: "easy", 
    pace: 25,
    hints: ["Start over from scratch", "Show step-by-step", "Watch an animation"],
    badge: "bg-red-100 text-red-700", 
    emoji: "😤"
  },
  Bored: {
    title: "Did you know? BSTs power Google autocomplete",
    body: "Every time you search and get instant suggestions, a tree structure works behind the scenes. Spotify uses BSTs to find your next song in milliseconds. Netflix uses them for recommendations. Want to build one?",
    difficulty: "medium", 
    pace: 55,
    hints: ["Show real-world demo", "Try the challenge", "Build a mini project"],
    badge: "bg-blue-100 text-blue-700", 
    emoji: "😐"
  },
  Excited: {
    title: "Love the energy — let us go faster",
    body: "You are clearly getting this. Let us skip the basics and jump into tree rotations. This is where BSTs get really powerful — and where most developers get impressed.",
    difficulty: "hard", 
    pace: 90,
    hints: [],
    badge: "bg-green-100 text-green-700", 
    emoji: "😄"
  },
  Breakthrough: {
    title: "Outstanding — AVL Self-Balancing Trees",
    body: "You have fully mastered BSTs. AVL trees auto-rebalance after every insertion guaranteeing O(log n) even in worst cases. This is senior-engineer territory. Ready to implement one from scratch?",
    difficulty: "hard", 
    pace: 100,
    hints: [],
    badge: "bg-purple-100 text-purple-700", 
    emoji: "🤩"
  }
};
