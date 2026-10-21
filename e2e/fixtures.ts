import { test as base, expect, type Page } from '@playwright/test';
import { E2E_STORAGE_KEY as STORAGE_KEY, E2E_SUPABASE_URL as SUPABASE_URL } from './env';

// Sesión y datos simulados: no hay bypass de auth en el código de la app.
// supabase.auth.getSession() acepta la sesión guardada en localStorage sin ir al servidor
// y todas las requests a Supabase se responden acá (cualquier escritura se rechaza).

const USER = {
  id: '00000000-0000-4000-8000-000000000001',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'medica@example.com',
  app_metadata: { provider: 'google' },
  user_metadata: {},
  created_at: '2025-01-01T00:00:00Z',
};

const base64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

function fakeSession() {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
  const accessToken = [
    base64url({ alg: 'HS256', typ: 'JWT' }),
    base64url({ sub: USER.id, role: 'authenticated', aud: 'authenticated', exp }),
    'firma',
  ].join('.');
  return {
    access_token: accessToken,
    refresh_token: 'refresh',
    token_type: 'bearer',
    expires_in: 60 * 60 * 24,
    expires_at: exp,
    user: USER,
  };
}

const OBRAS = ['Pami', 'Ioma', 'Medife', 'Particular', null] as const;
const LOCALIDADES = ['Del Viso', 'Garin', 'Maquinista Savio', 'Pilar', null] as const;
const APELLIDOS = ['Acosta', 'Benítez', 'Castro', 'Díaz', 'Fernández', 'Gómez', 'Herrera', 'Ibáñez', 'Juárez', 'López', 'Medina', 'Núñez', 'Ortiz', 'Pérez', 'Quiroga', 'Romero', 'Sosa', 'Torres', 'Vega', 'Zárate'];
const NOMBRES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elena', 'Facundo', 'Gabriela', 'Hugo'];

export const TOTAL_PATIENTS = 120;

// Paciente de referencia para el detalle: identificadores con ceros a la izquierda
export const PACIENTE = {
  id: '10000000-0000-4000-8000-000000000000',
  nombre: 'Marta',
  apellido: 'Aguirre',
  documento: '04123456',
  tipo_documento: 'DNI',
  numero_tramite: '00612345987',
  numero_afiliado: '15012345678900',
  obra_social: 'Pami',
  localidad: 'Pilar',
  fecha_nacimiento: '1948-03-12',
  telefono: '11 5555-0101',
  email: 'marta@example.com',
  direccion: 'Av. Tratado del Pilar 123',
};

function buildPatients() {
  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i < TOTAL_PATIENTS; i++) {
    rows.push({
      id: `10000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      nombre: NOMBRES[i % NOMBRES.length],
      apellido: `${APELLIDOS[i % APELLIDOS.length]} ${i}`,
      documento: String(20000000 + i * 7919),
      tipo_documento: i % 9 === 0 ? null : 'DNI',
      numero_tramite: null,
      numero_afiliado: null,
      obra_social: OBRAS[i % OBRAS.length],
      localidad: LOCALIDADES[i % LOCALIDADES.length],
      fecha_nacimiento: i % 11 === 0 ? null : `${1940 + (i % 60)}-${String((i % 12) + 1).padStart(2, '0')}-15`,
      telefono: i % 3 === 0 ? null : `11 5555-${String(1000 + i)}`,
      email: null,
      direccion: null,
    });
  }
  rows.push(PACIENTE);
  return rows
    .map((row): Record<string, unknown> => ({ ...row, user_id: USER.id, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' }))
    .sort((a, b) => String(a.apellido).localeCompare(String(b.apellido)));
}

const PATIENTS = buildPatients();

const CONSULTAS = [
  { id: 'c1', fecha: '2026-09-10', tipo: 'Segunda Consulta', notas: 'Control de presión arterial. TA 130/80.\nContinúa con enalapril 10 mg.' },
  { id: 'c2', fecha: '2026-08-02', tipo: 'Primer Consulta', notas: 'Consulta por cefalea tensional de dos semanas de evolución.' },
].map((c) => ({ ...c, patient_id: PACIENTE.id, user_id: USER.id, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }));

async function mockSupabase(page: Page) {
  await page.addInitScript(
    ([key, session]) => window.localStorage.setItem(key, JSON.stringify(session)),
    [STORAGE_KEY, fakeSession()] as const,
  );

  await page.route(`${SUPABASE_URL}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204 });
    if (request.method() !== 'GET') {
      return route.fulfill({ status: 405, json: { message: 'Escrituras deshabilitadas en el smoke test' } });
    }
    if (url.pathname === '/auth/v1/user') return route.fulfill({ json: USER });

    const single = (request.headers()['accept'] ?? '').includes('application/vnd.pgrst.object+json');
    const eq = (column: string) => url.searchParams.get(column)?.replace(/^eq\./, '');

    let rows: Record<string, unknown>[] | null = null;
    if (url.pathname === '/rest/v1/patients') {
      const id = eq('id');
      rows = id ? PATIENTS.filter((p) => p.id === id) : PATIENTS;
    } else if (url.pathname === '/rest/v1/consultas') {
      rows = CONSULTAS.filter((c) => c.patient_id === eq('patient_id'));
    }
    if (!rows) return route.fulfill({ status: 404, json: { message: 'No simulado' } });

    if (single) {
      return rows.length === 1
        ? route.fulfill({ json: rows[0] })
        : route.fulfill({ status: 406, json: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' } });
    }
    return route.fulfill({ json: rows });
  });
}

export const test = base.extend<{ app: Page }>({
  app: async ({ page }, provide) => {
    await mockSupabase(page);
    await provide(page);
  },
});

export { expect };

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow, 'la página no debe tener scroll horizontal').toBe(false);
}
