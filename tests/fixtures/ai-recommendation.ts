import type { AiRecommendation, InsertAiRecommendation } from "@shared/schema";

// Synthetic data only; client and reviewer IDs deliberately differ.
export const recommendationInput = {
  userId: 17,
  therapistId: 42,
  title: "Try a grounding exercise",
  content: "Name five things you can see.",
  type: "activity",
  aiReasoning: "A brief exercise for practicing awareness.",
  relatedDataType: "none",
  suggestedResources: [3, 9],
  implementationSteps: ["Pause", "Look around"],
} satisfies InsertAiRecommendation;

export const recommendation: AiRecommendation = {
  ...recommendationInput,
  id: 81,
  status: "pending",
  therapistNotes: null,
  relatedDataId: null,
  createdAt: new Date("2026-01-02T03:04:05Z"),
  approvedAt: null,
  rejectedAt: null,
  implementedAt: null,
};
