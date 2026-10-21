import { test, expect, PACIENTE, CATALOGOS, OBRA_ARCHIVADA } from './fixtures';
import { E2E_SUPABASE_URL } from './env';

// Paciente de fixtures.ts con la obra social archivada
const PACIENTE_ARCHIVADA = '10000000-0000-4000-8000-000000000001';

const nombresActivos = (catalogo: string) =>
  CATALOGOS[catalogo].filter((opcion) => opcion.activo).map((opcion) => opcion.nombre as string);

test.describe('Opciones de las listas configurables', () => {
  test('el alta ofrece las opciones activas, en orden', async ({ app }) => {
    await app.goto('/');
    await app.getByRole('button', { name: 'Agregar paciente' }).click();
    const dialog = app.getByRole('dialog', { name: 'Agregar nuevo paciente' });
    await dialog.getByRole('combobox', { name: 'Obra social' }).click();
    await expect(app.getByRole('option')).toHaveText(['Sin especificar', ...nombresActivos('obras_sociales')]);
  });

  test('la consulta ofrece los tipos de consulta de la lista', async ({ app }) => {
    await app.goto(`/patient/${PACIENTE.id}`);
    await app.getByRole('button', { name: 'Nueva consulta' }).click();
    await app.getByRole('dialog', { name: 'Nueva consulta' }).getByRole('combobox', { name: 'Tipo de consulta' }).click();
    await expect(app.getByRole('option')).toHaveText(['Sin especificar', ...nombresActivos('tipos_consulta')]);
  });

  test('una opción archivada en uso sigue en el filtro y en el formulario del paciente', async ({ app }) => {
    await app.goto('/');
    await app.getByRole('combobox', { name: 'Filtrar por obra social' }).click();
    await expect(app.getByRole('option', { name: OBRA_ARCHIVADA })).toBeVisible();

    await app.goto(`/patient/${PACIENTE_ARCHIVADA}`);
    await app.getByRole('button', { name: 'Editar' }).click();
    await expect(app.getByRole('dialog', { name: 'Editar paciente' }).getByRole('combobox', { name: 'Obra social' })).toHaveText(OBRA_ARCHIVADA);
  });

  test('el badge usa el color elegido para la obra social', async ({ app }) => {
    await app.goto(`/patient/${PACIENTE.id}`);
    await expect(app.locator('main').getByText(PACIENTE.obra_social, { exact: true })).toHaveClass(/bg-tint-sky/);
  });

  test('con una lista vacía el formulario indica dónde cargarla', async ({ app }) => {
    await app.route(`${E2E_SUPABASE_URL}/rest/v1/localidades*`, (route) => route.fulfill({ json: [] }));
    await app.goto('/');
    await app.getByRole('button', { name: 'Agregar paciente' }).click();
    const dialog = app.getByRole('dialog', { name: 'Agregar nuevo paciente' });
    await expect(dialog.getByText('La lista de localidades está vacía.')).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Listas' })).toHaveAttribute('href', '/listas#localidades');
  });
});

test.describe('Pantalla de listas', () => {
  test('muestra las tres listas con las activas y las archivadas aparte', async ({ app }, testInfo) => {
    await app.goto('/');
    // En celular el menú lateral está cerrado
    if (testInfo.project.name === 'mobile') await app.getByRole('button', { name: 'Mostrar u ocultar menú' }).first().click();
    await app.getByRole('link', { name: 'Listas' }).click();
    await expect(app.getByRole('heading', { name: 'Listas', level: 1 })).toBeVisible();
    for (const [catalogo, titulo] of [['obras_sociales', 'Obras sociales'], ['localidades', 'Localidades'], ['tipos_consulta', 'Tipos de consulta']]) {
      await expect(app.getByRole('list', { name: `${titulo} activas` }).getByRole('listitem')).toHaveText(nombresActivos(catalogo).map((n) => new RegExp(n)));
    }
    await expect(app.getByRole('list', { name: 'Obras sociales archivadas' })).toBeHidden();
    await app.getByText('Archivadas (1)').click();
    await expect(app.getByRole('list', { name: 'Obras sociales archivadas' })).toContainText(OBRA_ARCHIVADA);
  });

  test('valida el nombre antes de agregar y manda el alta con orden y color', async ({ app }) => {
    await app.goto('/listas');
    const input = app.getByRole('textbox', { name: 'Nueva obra social' });
    await input.fill('  osde ');
    await input.press('Enter');
    await expect(app.getByText('Ya está en la lista', { exact: true })).toBeVisible();
    await input.fill('medicus');
    await input.press('Enter');
    await expect(app.getByText('Ya está en la lista, archivada: restaurala')).toBeVisible();

    await input.fill('  Accord Salud ');
    // El mock rechaza las escrituras; se verifica lo que se manda
    const insert = app.waitForRequest((r) => r.method() === 'POST' && r.url().includes('/rest/v1/obras_sociales'));
    await input.press('Enter');
    expect((await insert).postDataJSON()).toMatchObject({ nombre: 'Accord Salud', orden: 6, color: 'lemon' });
    await expect(app.getByText('No se pudo agregar la obra social', { exact: true })).toBeVisible();
    await expect(input).toHaveValue('  Accord Salud ');
  });

  test('renombrar valida duplicados y Escape cancela', async ({ app }) => {
    await app.goto('/listas');
    await app.getByRole('button', { name: 'Renombrar Belgrano' }).click();
    const input = app.getByRole('textbox', { name: 'Nuevo nombre para Belgrano' });
    await expect(input).toBeFocused();
    await input.fill('PALERMO');
    await input.press('Enter');
    await expect(app.getByText('Ya está en la lista', { exact: true })).toBeVisible();
    await input.press('Escape');
    await expect(input).toBeHidden();
  });

  test('subir y bajar mandan el orden nuevo', async ({ app }) => {
    await app.goto('/listas');
    await expect(app.getByRole('button', { name: 'Subir Primera vez' })).toBeDisabled();
    const updates: string[] = [];
    app.on('request', (r) => { if (r.method() === 'PATCH' && r.url().includes('/rest/v1/tipos_consulta')) updates.push(r.postData() ?? ''); });
    await app.getByRole('button', { name: 'Bajar Primera vez' }).click();
    await expect.poll(() => updates.sort()).toEqual(['{"orden":1}', '{"orden":2}']);
  });

  test('el aviso de lista vacía lleva a cargarla', async ({ app }) => {
    await app.goto('/listas#tipos_consulta');
    await expect(app.getByRole('textbox', { name: 'Nuevo tipo de consulta' })).toBeFocused();
  });
});
