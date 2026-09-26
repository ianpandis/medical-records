import { test, expect, expectNoHorizontalOverflow, PACIENTE, TOTAL_PATIENTS } from './fixtures';

test.describe('Dashboard', () => {
  test('carga la lista de pacientes', async ({ app }) => {
    await app.goto('/');
    await expect(app.getByRole('heading', { name: 'Pacientes', level: 1 })).toBeVisible();
    await expect(app.getByText(`${TOTAL_PATIENTS} pacientes`, { exact: true })).toBeVisible();
    await expect(app.getByRole('link', { name: /Aguirre Marta/ }).first()).toBeVisible();
    await expectNoHorizontalOverflow(app);
  });

  test('filtra por nombre o documento', async ({ app }) => {
    await app.goto('/');
    await app.getByRole('searchbox', { name: 'Buscar pacientes' }).fill('aguirre');
    await expect(app.getByText(`1 de ${TOTAL_PATIENTS} pacientes`)).toBeVisible();

    await app.getByRole('searchbox', { name: 'Buscar pacientes' }).fill(PACIENTE.documento);
    await expect(app.getByText(`1 de ${TOTAL_PATIENTS} pacientes`)).toBeVisible();

    await app.getByRole('button', { name: 'Limpiar filtros' }).click();
    await expect(app.getByText(`${TOTAL_PATIENTS} pacientes`, { exact: true })).toBeVisible();
  });

  test('los filtros viven en la URL y sobreviven a entrar a un paciente', async ({ app }) => {
    await app.goto('/?obra=Pami&localidad=Pilar');
    await expect(app.getByRole('combobox', { name: 'Filtrar por obra social' })).toHaveText('Pami');
    await expect(app.getByRole('combobox', { name: 'Filtrar por localidad' })).toHaveText('Pilar');

    await app.getByRole('searchbox', { name: 'Buscar pacientes' }).fill('aguirre');
    await expect(app).toHaveURL(/q=aguirre/);
    await expect(app.getByText(`1 de ${TOTAL_PATIENTS} pacientes`)).toBeVisible();

    // Por el breadcrumb
    await app.getByRole('link', { name: /Aguirre Marta/ }).first().click();
    await expect(app.getByRole('heading', { name: 'Aguirre Marta', level: 1 })).toBeVisible();
    await app.getByRole('navigation', { name: 'breadcrumb' }).getByRole('link', { name: 'Pacientes' }).click();
    await expect(app.getByRole('searchbox', { name: 'Buscar pacientes' })).toHaveValue('aguirre');
    await expect(app.getByText(`1 de ${TOTAL_PATIENTS} pacientes`)).toBeVisible();

    // Y con el botón atrás del navegador
    await app.getByRole('link', { name: /Aguirre Marta/ }).first().click();
    await expect(app.getByRole('heading', { name: 'Aguirre Marta', level: 1 })).toBeVisible();
    await app.goBack();
    await expect(app.getByRole('searchbox', { name: 'Buscar pacientes' })).toHaveValue('aguirre');
  });

  test('un valor inválido en la URL no filtra', async ({ app }) => {
    await app.goto('/?obra=Inexistente');
    await expect(app.getByText(`${TOTAL_PATIENTS} pacientes`, { exact: true })).toBeVisible();
  });

  test('pagina de a 50 y el filtro vuelve a la primera página', async ({ app }) => {
    await app.goto('/');
    const paginacion = app.getByRole('navigation', { name: 'Paginación' });
    await expect(paginacion.getByText(`1–50 de ${TOTAL_PATIENTS}`)).toBeVisible();
    await expect(paginacion.getByRole('button', { name: 'Página anterior' })).toBeDisabled();

    await paginacion.getByRole('button', { name: 'Página siguiente' }).click();
    await expect(app).toHaveURL(/pagina=2/);
    await expect(paginacion.getByText(`51–100 de ${TOTAL_PATIENTS}`)).toBeVisible();

    await app.getByRole('searchbox', { name: 'Buscar pacientes' }).fill('a');
    await expect(app).not.toHaveURL(/pagina=/);
  });

  test('ordena por columna con aria-sort', async ({ app }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'En mobile la lista son cards, sin headers');
    await app.goto('/');
    const table = app.getByRole('table');
    const edad = table.getByRole('columnheader', { name: 'Edad' });
    await expect(edad).toHaveAttribute('aria-sort', 'none');
    await expect(table.getByRole('columnheader', { name: 'Paciente' })).toHaveAttribute('aria-sort', 'ascending');

    const edades = async () =>
      (await table.locator('tbody tr td:nth-child(5)').allInnerTexts()).map(Number).filter((n) => !Number.isNaN(n));

    await edad.getByRole('button').click();
    await expect(edad).toHaveAttribute('aria-sort', 'ascending');
    await expect(app).toHaveURL(/orden=edad/);
    const asc = await edades();
    expect(asc).toEqual([...asc].sort((a, b) => a - b));

    await edad.getByRole('button').click();
    await expect(edad).toHaveAttribute('aria-sort', 'descending');
    const desc = await edades();
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
    expect(desc[0]).toBeGreaterThan(asc[0]);
  });

  test('el alta valida campos requeridos e identificadores', async ({ app }) => {
    await app.goto('/');
    await app.getByRole('button', { name: 'Agregar paciente' }).click();
    const dialog = app.getByRole('dialog', { name: 'Agregar nuevo paciente' });
    await expect(dialog).toBeVisible();

    await dialog.getByLabel('Número de trámite').fill('00612.345');
    await dialog.getByRole('button', { name: 'Agregar paciente' }).click();

    await expect(dialog.getByText('El apellido es requerido')).toBeVisible();
    await expect(dialog.getByText('El nombre es requerido')).toBeVisible();
    await expect(dialog.getByText('Solo números, sin puntos ni espacios')).toBeVisible();
    await expect(dialog.getByLabel('Apellido')).toHaveAttribute('aria-invalid', 'true');
  });
});

test.describe('Detalle de paciente', () => {
  test('muestra datos, identificadores con ceros a la izquierda y consultas', async ({ app }) => {
    await app.goto(`/patient/${PACIENTE.id}`);
    await expect(app.getByRole('heading', { name: 'Aguirre Marta', level: 1 })).toBeVisible();
    await expect(app.getByText(PACIENTE.numero_tramite, { exact: true })).toBeVisible();
    await expect(app.getByText(PACIENTE.numero_afiliado, { exact: true })).toBeVisible();
    await expect(app.getByText('2 consultas')).toBeVisible();
    await expectNoHorizontalOverflow(app);
  });

  test('el form de edición conserva los ceros a la izquierda', async ({ app }) => {
    await app.goto(`/patient/${PACIENTE.id}`);
    await app.getByRole('button', { name: 'Editar', exact: true }).click();
    const dialog = app.getByRole('dialog', { name: 'Editar paciente' });
    await expect(dialog.getByLabel('Número de trámite')).toHaveValue(PACIENTE.numero_tramite);
    await expect(dialog.getByLabel('Número de documento')).toHaveValue(PACIENTE.documento);
  });

  test('un paciente inexistente vuelve a la lista', async ({ app }) => {
    await app.goto('/patient/no-existe');
    await expect(app).toHaveURL('/');
    await expect(app.getByText('No se pudo cargar los detalles del paciente', { exact: true })).toBeVisible();
  });
});
