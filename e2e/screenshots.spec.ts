import { test, expect, PACIENTE } from './fixtures';
import { E2E_SUPABASE_URL } from './env';

// Capturas del README y la imagen og:image, con los datos ficticios de fixtures.ts.
// No corre con el resto de los tests: npm run screenshots
test.skip(!process.env.SCREENSHOTS, 'Solo con npm run screenshots');

const DIR = 'docs/screenshots';

// Lista corta con nombres creíbles (todos ficticios) en lugar de los 120 pacientes numerados de los tests
const NOMBRES: [string, string, string | null, string | null, string | null][] = [
  ['Lucía', 'Benítez', 'Swiss Medical', 'Flores', '1962-05-21'],
  ['Roberto', 'Castro', 'OSDE', 'Caballito', '1944-11-02'],
  ['Silvia', 'Domínguez', 'Galeno', 'Belgrano', '1979-01-30'],
  ['Jorge', 'Fernández', 'OSDE', 'Palermo', '1950-07-14'],
  ['Valeria', 'Gómez', 'Particular', 'Belgrano', '1988-09-09'],
  ['Héctor', 'Ibáñez', 'OSDE', 'Flores', '1939-03-03'],
  ['Carolina', 'Juárez', 'Swiss Medical', null, '1993-12-12'],
  ['Martín', 'López', 'Galeno', 'Caballito', '1971-04-18'],
  ['Norma', 'Medina', 'OSDE', 'Belgrano', '1947-08-25'],
  ['Pablo', 'Núñez', 'Particular', 'Palermo', '1984-02-07'],
  ['Graciela', 'Ortiz', 'Swiss Medical', 'Flores', '1958-10-11'],
  ['Diego', 'Romero', null, 'Caballito', null],
  ['Alicia', 'Sosa', 'OSDE', 'Belgrano', '1941-06-29'],
  ['Federico', 'Torres', 'Galeno', 'Flores', '1990-11-23'],
];
const PACIENTES = [
  PACIENTE,
  ...NOMBRES.map(([nombre, apellido, obra_social, localidad, fecha_nacimiento], i) => ({
    id: `20000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
    nombre,
    apellido,
    tipo_documento: 'DNI',
    documento: String(14000000 + i * 1733117),
    numero_tramite: null,
    numero_afiliado: null,
    obra_social,
    localidad,
    fecha_nacimiento,
    telefono: i % 4 === 3 ? null : `11 5555-${String(2000 + i * 37)}`,
    email: null,
    direccion: null,
  })),
].sort((a, b) => a.apellido.localeCompare(b.apellido));

test.beforeEach(async ({ app }) => {
  await app.clock.setFixedTime(new Date('2026-10-20T10:00:00-03:00'));
  // Se registra después del mock de fixtures.ts, así que tiene prioridad para /rest/v1/patients
  await app.route(`${E2E_SUPABASE_URL}/rest/v1/patients*`, (route) => {
    const request = route.request();
    if (request.method() !== 'GET') return route.fallback();
    const id = new URL(request.url()).searchParams.get('id')?.replace(/^eq\./, '');
    const rows = id ? PACIENTES.filter((p) => p.id === id) : PACIENTES;
    const single = (request.headers()['accept'] ?? '').includes('application/vnd.pgrst.object+json');
    return route.fulfill({ json: single ? rows[0] : rows });
  });
});

test('escritorio', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');

  await app.goto('/');
  await expect(app.getByRole('table')).toBeVisible();
  await app.screenshot({ path: `${DIR}/listado.png`, animations: 'disabled' });

  await app.goto(`/patient/${PACIENTE.id}`);
  await expect(app.getByText('2 consultas')).toBeVisible();
  await app.screenshot({ path: `${DIR}/detalle.png`, animations: 'disabled' });

  await app.emulateMedia({ colorScheme: 'dark' });
  await app.reload();
  await expect(app.getByText('2 consultas')).toBeVisible();
  await app.screenshot({ path: `${DIR}/detalle-oscuro.png`, animations: 'disabled' });
  await app.emulateMedia({ colorScheme: 'light' });

  await app.goto('/');
  await app.getByRole('button', { name: 'Agregar paciente' }).click();
  await expect(app.getByRole('dialog', { name: 'Agregar nuevo paciente' })).toBeVisible();
  await app.screenshot({ path: `${DIR}/alta.png`, animations: 'disabled' });
});

test('og:image', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');

  await app.setViewportSize({ width: 1200, height: 630 });
  await app.goto('/');
  await expect(app.getByRole('table')).toBeVisible();
  await app.screenshot({ path: 'public/og-image.png', animations: 'disabled' });
});

test('mobile', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');

  await app.goto('/');
  await expect(app.getByText(`${PACIENTES.length} pacientes`, { exact: true })).toBeVisible();
  await app.screenshot({ path: `${DIR}/listado-mobile.png`, animations: 'disabled' });

  await app.goto(`/patient/${PACIENTE.id}`);
  await expect(app.getByText('2 consultas')).toBeVisible();
  await app.screenshot({ path: `${DIR}/detalle-mobile.png`, animations: 'disabled' });
});
