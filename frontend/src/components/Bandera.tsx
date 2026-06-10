import { codigoBandera, urlBandera } from "@/lib/banderas";
import { cn } from "@/lib/utils";

type Props = {
  equipo: string;
  className?: string;
};

/** Bandera del país (flagcdn.com); balón para placeholders de eliminatorias. */
export function Bandera({ equipo, className }: Props) {
  const codigo = codigoBandera(equipo);
  if (codigo === null) {
    return (
      <span aria-hidden className={cn("inline-block w-5 text-center", className)}>
        ⚽
      </span>
    );
  }
  return (
    <img
      src={urlBandera(codigo, 40)}
      srcSet={`${urlBandera(codigo, 80)} 2x`}
      alt=""
      aria-hidden
      loading="lazy"
      width={20}
      className={cn("inline-block w-5 rounded-[2px] border border-border/50 align-baseline", className)}
    />
  );
}

/** Bandera + nombre del equipo, como unidad inline. */
export function EquipoConBandera({ equipo, className }: Props) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap", className)}>
      <Bandera equipo={equipo} />
      {equipo}
    </span>
  );
}
