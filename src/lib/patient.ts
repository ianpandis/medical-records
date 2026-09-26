import type { Patient } from '@/pages/Dashboard';

// Función para calcular la edad a partir de la fecha de nacimiento
export function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

export const OBRAS_SOCIALES = ['Pami', 'Ioma', 'Medife', 'Particular'] as const;
export const LOCALIDADES = ['Del Viso', 'Garin', 'Maquinista Savio', 'Pilar'] as const;
export const TIPOS_DOCUMENTO = ['DNI', 'LE', 'LC'] as const;

// Tint pastel por obra social (tokens --tint-* en index.css)
export const obraSocialTint: Record<NonNullable<Patient['obra_social']>, string> = {
  Pami: 'bg-tint-sky text-tint-sky-foreground',
  Ioma: 'bg-tint-mint text-tint-mint-foreground',
  Medife: 'bg-tint-peach text-tint-peach-foreground',
  Particular: 'bg-tint-lavender text-tint-lavender-foreground',
};
