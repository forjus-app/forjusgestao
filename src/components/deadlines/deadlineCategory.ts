export type DeadlineCategory = "normal" | "cumprimento_sentenca";

export const DEADLINE_CATEGORY_OPTIONS: { value: DeadlineCategory; label: string }[] = [
  { value: "normal", label: "Prazo normal" },
  { value: "cumprimento_sentenca", label: "Cumprimento de Sentença" },
];
