// Código de bandera (flagcdn.com) por nombre de equipo — los 48 clasificados
// al Mundial 2026. Inglaterra/Escocia usan los códigos regionales de flagcdn.
// Placeholders de eliminatorias ("Ganador P74") devuelven null.

const CODIGO_POR_EQUIPO: Record<string, string> = {
  "México": "mx",
  "Sudáfrica": "za",
  "Corea del Sur": "kr",
  "Chequia": "cz",
  "Canadá": "ca",
  "Bosnia y Herzegovina": "ba",
  "Catar": "qa",
  "Suiza": "ch",
  "Brasil": "br",
  "Haití": "ht",
  "Marruecos": "ma",
  "Escocia": "gb-sct",
  "Estados Unidos": "us",
  "Paraguay": "py",
  "Turquía": "tr",
  "Australia": "au",
  "Alemania": "de",
  "Ecuador": "ec",
  "Curazao": "cw",
  "Costa de Marfil": "ci",
  "Países Bajos": "nl",
  "Japón": "jp",
  "Suecia": "se",
  "Túnez": "tn",
  "Bélgica": "be",
  "Egipto": "eg",
  "Irán": "ir",
  "Nueva Zelanda": "nz",
  "España": "es",
  "Cabo Verde": "cv",
  "Arabia Saudita": "sa",
  "Uruguay": "uy",
  "Francia": "fr",
  "Irak": "iq",
  "Noruega": "no",
  "Senegal": "sn",
  "Argentina": "ar",
  "Argelia": "dz",
  "Austria": "at",
  "Jordania": "jo",
  "Portugal": "pt",
  "Colombia": "co",
  "RD Congo": "cd",
  "Uzbekistán": "uz",
  "Inglaterra": "gb-eng",
  "Croacia": "hr",
  "Ghana": "gh",
  "Panamá": "pa",
};

export function codigoBandera(equipo: string): string | null {
  return CODIGO_POR_EQUIPO[equipo] ?? null;
}

/** URL del PNG de la bandera en flagcdn (w40 = 40px de ancho, con @2x para retina). */
export function urlBandera(codigo: string, ancho: 20 | 40 | 80 = 40): string {
  return `https://flagcdn.com/w${ancho}/${codigo}.png`;
}
