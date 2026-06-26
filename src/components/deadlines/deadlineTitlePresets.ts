export const DEADLINE_TITLE_PRESETS = [
  "Emenda à Inicial",
  "Contestação",
  "Réplica",
  "Especificação de Provas",
  "Embargos de Declaração",
  "Manifestação",
  "Juntada de Documentos",
  "Recolher Custas",
  "Contrarrazões",
  "Apelação",
  "Agravo de Instrumento",
  "Recurso Especial",
  "Recurso Extraordinário",
  "Alegações Finais",
  "Cumprimento de Sentença",
] as const;

export const CUMPRIMENTO_SENTENCA_TITLE = "Cumprimento de Sentença";

export function isCumprimentoSentenca(title: string | null | undefined) {
  if (!title) return false;
  return title.trim().toLowerCase() === CUMPRIMENTO_SENTENCA_TITLE.toLowerCase();
}