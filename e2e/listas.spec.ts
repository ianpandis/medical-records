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
