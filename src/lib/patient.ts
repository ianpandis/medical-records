import { parseISO } from 'date-fns';

export interface Patient {
  id: string;
  documento: string | null;
  tipo_documento: 'DNI' | 'LE' | 'LC' | null;
  numero_tramite: string | null;
  numero_afiliado: string | null;
  obra_social: 'Pami' | 'Ioma' | 'Medife' | 'Particular' | null;
  localidad: 'Del Viso' | 'Garin' | 'Maquinista Savio' | 'Pilar' | null;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Consultation {
  id: string;
  patient_id: string;
  fecha: string;
  notas: string;
  tipo: 'Primer Consulta' | 'Segunda Consulta' | 'Domicilio' | 'Espontanea' | null;
  created_at: string;
  updated_at: string;
}

// Función para calcular la edad a partir de la fecha de nacimiento
export function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date();
  // parseISO toma 'yyyy-MM-dd' como fecha local; new Date() la toma como UTC y en UTC-3
  // cae el día anterior (la víspera del cumpleaños ya sumaba el año)
  const nacimiento = parseISO(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

// Documento, trámite y afiliado son texto (conservan ceros a la izquierda).
// Hasta aplicar la migración 20260925000000 la base los devuelve como number:
// se normalizan acá para que el resto de la app trabaje siempre con string.
export function toPatient(row: Record<string, unknown>): Patient {
  const asText = (value: unknown) => (value === null || value === undefined ? null : String(value));
  return {
    ...(row as unknown as Patient),
    documento: asText(row.documento),
    numero_tramite: asText(row.numero_tramite),
    numero_afiliado: asText(row.numero_afiliado),
  };
}

// Solo dígitos (o vacío); se valida como texto para no perder ceros a la izquierda
export const SOLO_DIGITOS = /^\d*$/;

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

// Orden del listado de pacientes
export const SORT_KEYS = ['paciente', 'edad', 'obra'] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDir = 'asc' | 'desc';

const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });
const nombreCompleto = (patient: Patient) => `${patient.apellido} ${patient.nombre}`;

export function sortPatients(patients: Patient[], key: SortKey, dir: SortDir): Patient[] {
  const sign = dir === 'asc' ? 1 : -1;
  const value = (patient: Patient) =>
    key === 'paciente' ? nombreCompleto(patient) : key === 'obra' ? patient.obra_social : patient.fecha_nacimiento;
  return [...patients].sort((a, b) => {
    const x = value(a);
    const y = value(b);
    // Los vacíos van siempre al final, en cualquier dirección
    if (x === null || y === null) {
      if (x !== y) return x === null ? 1 : -1;
    } else {
      // Edad ascendente = fecha de nacimiento más reciente primero
      const cmp = key === 'edad' ? collator.compare(y, x) : collator.compare(x, y);
      if (cmp !== 0) return sign * cmp;
    }
    return collator.compare(nombreCompleto(a), nombreCompleto(b));
  });
}
