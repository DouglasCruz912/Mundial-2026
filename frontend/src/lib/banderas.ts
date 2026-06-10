// Bandera emoji por nombre de equipo (los 48 clasificados al Mundial 2026).
// Placeholders de eliminatorias ("Ganador P74") caen al fallback ⚽.

const ISO_POR_EQUIPO: Record<string, string> = {
  "México": "MX",
  "Sudáfrica": "ZA",
  "Corea del Sur": "KR",
  "Chequia": "CZ",
  "Canadá": "CA",
  "Bosnia y Herzegovina": "BA",
  "Catar": "QA",
  "Suiza": "CH",
  "Brasil": "BR",
  "Haití": "HT",
  "Marruecos": "MA",
  "Estados Unidos": "US",
  "Paraguay": "PY",
  "Turquía": "TR",
  "Australia": "AU",
  "Alemania": "DE",
  "Ecuador": "EC",
  "Curazao": "CW",
  "Costa de Marfil": "CI",
  "Países Bajos": "NL",
  "Japón": "JP",
  "Suecia": "SE",
  "Túnez": "TN",
  "Bélgica": "BE",
  "Egipto": "EG",
  "Irán": "IR",
  "Nueva Zelanda": "NZ",
  "España": "ES",
  "Cabo Verde": "CV",
  "Arabia Saudita": "SA",
  "Uruguay": "UY",
  "Francia": "FR",
  "Irak": "IQ",
  "Noruega": "NO",
  "Senegal": "SN",
  "Argentina": "AR",
  "Argelia": "DZ",
  "Austria": "AT",
  "Jordania": "JO",
  "Portugal": "PT",
  "Colombia": "CO",
  "RD Congo": "CD",
  "Uzbekistán": "UZ",
  "Croacia": "HR",
  "Ghana": "GH",
  "Panamá": "PA",
};

// Inglaterra y Escocia no tienen ISO propio: emoji de etiqueta Unicode
const BANDERAS_ESPECIALES: Record<string, string> = {
  Inglaterra: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Escocia: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
};

function isoAEmoji(iso: string): string {
  return [...iso].map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join("");
}

export function bandera(equipo: string): string {
  const especial = BANDERAS_ESPECIALES[equipo];
  if (especial !== undefined) return especial;
  const iso = ISO_POR_EQUIPO[equipo];
  if (iso !== undefined) return isoAEmoji(iso);
  return "⚽";
}

/** "🇲🇽 México" listo para mostrar. */
export function equipoConBandera(equipo: string): string {
  return `${bandera(equipo)} ${equipo}`;
}
