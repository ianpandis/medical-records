import { parseISO } from 'date-fns';

export interface Patient {
  id: string;
  documento: string | null;
  tipo_documento: 'DNI' | 'LE' | 'LC' | null;
  numero_tramite: string | null;
  numero_afiliado: string | null;
  // Nombre de una opción de las listas configurables (ver src/lib/catalogos.ts)
  obra_social: string | null;
  localidad: string | null;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  user_id: string | null;
}

export interface Consultation {
  id: string;
  patient_id: string;
  fecha: string;
  notas: string;
  tipo: string | null;
  user_id: string;
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
// Bases creadas antes de que fueran texto los devuelven como number;
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

// Largo máximo de los textos libres; coincide con los CHECK de
// supabase/migrations/20261020000000_limites_de_tamano.sql
export const LIMITES = {
  nombre: 100,
  apellido: 100,
  documento: 20,
  numero_tramite: 20,
  numero_afiliado: 30,
  telefono: 50,
  email: 254,
  direccion: 500,
  notas: 20000,
} as const;

const excede = (max: number) => `Máximo ${max.toLocaleString('es-AR')} caracteres`;
export const maxTexto = (campo: keyof typeof LIMITES) => [LIMITES[campo], excede(LIMITES[campo])] as const;

// Solo dígitos (o vacío); se valida como texto para no perder ceros a la izquierda
export const SOLO_DIGITOS = /^\d*$/;

export const TIPOS_DOCUMENTO = ['DNI', 'LE', 'LC'] as const;

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
