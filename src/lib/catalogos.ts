// Listas configurables por profesional (supabase/migrations/20261021000000_listas_configurables.sql).
// Los pacientes y las consultas guardan el nombre de la opción; la FK de la base valida
// que exista en la lista del profesional y propaga los renombres.

export const CATALOGOS = {
  obras_sociales: { titulo: 'Obras sociales', singular: 'obra social', nueva: 'Nueva obra social', la: 'la obra social' },
  localidades: { titulo: 'Localidades', singular: 'localidad', nueva: 'Nueva localidad', la: 'la localidad' },
  tipos_consulta: { titulo: 'Tipos de consulta', singular: 'tipo de consulta', nueva: 'Nuevo tipo de consulta', la: 'el tipo de consulta' },
} as const;

export type Catalogo = keyof typeof CATALOGOS;

export const CATALOGO_KEYS = Object.keys(CATALOGOS) as Catalogo[];

// Coincide con el CHECK de las tablas de catálogo
export const MAX_NOMBRE_OPCION = 60;

export interface Opcion {
  id: string;
  nombre: string;
  orden: number;
  activo: boolean;
  // Solo obras_sociales
  color?: Tint;
}

// Tints del badge de obra social (tokens --tint-* en index.css); coincide con el CHECK de obras_sociales
export const TINTS = ['sky', 'mint', 'peach', 'lavender', 'rose', 'lemon'] as const;
export type Tint = (typeof TINTS)[number];

export const tintClass: Record<Tint, string> = {
  sky: 'bg-tint-sky text-tint-sky-foreground',
  mint: 'bg-tint-mint text-tint-mint-foreground',
  peach: 'bg-tint-peach text-tint-peach-foreground',
  lavender: 'bg-tint-lavender text-tint-lavender-foreground',
  rose: 'bg-tint-rose text-tint-rose-foreground',
  lemon: 'bg-tint-lemon text-tint-lemon-foreground',
};

export const tintLabel: Record<Tint, string> = {
  sky: 'Celeste',
  mint: 'Verde',
  peach: 'Durazno',
  lavender: 'Lavanda',
  rose: 'Rosa',
  lemon: 'Amarillo',
};

// Opciones de un select: las activas y, si el registro tiene una archivada, también esa
// (si no, el select la mostraría vacía y al guardar se perdería)
export function opcionesParaSelect(opciones: Opcion[], actual?: string | null): string[] {
  const activas = opciones.filter((opcion) => opcion.activo).map((opcion) => opcion.nombre);
  return actual && !activas.includes(actual) ? [...activas, actual] : activas;
}

// Opciones de un filtro: las activas y las archivadas que todavía usa algún registro
export function opcionesParaFiltro(opciones: Opcion[], enUso: (string | null)[]): string[] {
  const usadas = new Set(enUso);
  return opciones.filter((opcion) => opcion.activo || usadas.has(opcion.nombre)).map((opcion) => opcion.nombre);
}
