export function digitsOnly(value: string) {
  return (value || "").replace(/\D/g, "");
}

export function formatCPF(value: string) {
  const d = digitsOnly(value).slice(0, 11);
  if (!d) return "";
  if (d.length <= 3) return d;
  if (d.length <= 6) return d.replace(/^(\d{3})(\d+)/, "$1.$2");
  if (d.length <= 9) return d.replace(/^(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
  return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

export function formatCNPJ(value: string) {
  const d = digitsOnly(value).slice(0, 14);
  if (!d) return "";
  if (d.length <= 2) return d;
  if (d.length <= 5) return d.replace(/^(\d{2})(\d+)/, "$1.$2");
  if (d.length <= 8) return d.replace(/^(\d{2})(\d{3})(\d+)/, "$1.$2.$3");
  if (d.length <= 12) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d+)/, "$1.$2.$3/$4");
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export function formatCPFOrCNPJ(value: string, clean: boolean = false) {
  const d = value.replace(/\D/g, ''); // Garante que temos apenas dígitos

  if (clean) return d;

  if (d.length <= 11) {
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else {
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
}

export function formatCEP(value: string) {
  const d = digitsOnly(value).slice(0, 8);
  if (!d) return "";
  if (d.length <= 5) return d;
  return d.replace(/^(\d{5})(\d{1,3})$/, "$1-$2");
}

// export function formatCPFOrCNPJ(value: string, clean: boolean = false) {
//   const d = value.replace(/\D/g, ''); // Garante que temos apenas dígitos

//   if (clean) return d;

//   if (d.length <= 11) {
//     return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
//   } else {
//     return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
//   }
// }

// /**
//  * Formata o CEP para exibição visual (com hífen)
//  * Ou retorna apenas números para envio a bancos/APIs
//  */
// export function formatCEP(value: string, clean: boolean = false): string {
//   const d = value.replace(/\D/g, '').slice(0, 8); // Remove tudo que não for dígito e limita a 8 caracteres

//   if (clean) {
//     return d; // Retorna apenas 12345678
//   }

//   if (d.length <= 5) {
//     return d;
//   }
  
//   return d.replace(/^(\d{5})(\d{1,3})$/, "$1-$2");
// }

export function formatPhone(value: string) {
  const d = digitsOnly(value).slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return d.replace(/^(\d{2})(\d{1,4})$/, "($1) $2");
  if (d.length <= 10) return d.replace(/^(\d{2})(\d{4})(\d{1,4})$/, "($1) $2-$3");
  return d.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
}

export function limitDigits(value: string, max: number) {
  return digitsOnly(value).slice(0, max);
}

export function toNumberOrNull(value: string | null | undefined) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (s === "") return null;
  // Accept decimal comma or dot
  const normalized = s.replace(/,/g, ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}
