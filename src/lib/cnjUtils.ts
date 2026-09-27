/**
 * Formata um número de processo para o padrão CNJ: 0000000-00.0000.0.00.0000
 * Remove tudo que não é dígito e aplica a máscara progressivamente.
 * Retorna a string formatada (ou parcial, enquanto o usuário digita).
 */
export function formatCnj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 20);
  let out = "";
  for (let i = 0; i < digits.length; i++) {
    if (i === 7) out += "-";
    if (i === 9) out += ".";
    if (i === 13) out += ".";
    if (i === 14) out += ".";
    if (i === 16) out += ".";
    out += digits[i];
  }
  return out;
}

/** Retorna apenas os dígitos do número CNJ (para comparação/deduplicação). */
export function cnjDigits(value: string | null | undefined): string {
  return (value || "").replace(/\D/g, "");
}

/** Verifica se o número CNJ está completo (20 dígitos). */
export function isCompleteCnj(value: string): boolean {
  return cnjDigits(value).length === 20;
}
