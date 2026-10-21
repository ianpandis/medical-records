import { test, expect, expectNoHorizontalOverflow, PACIENTE, TOTAL_PATIENTS } from './fixtures';
import { E2E_SUPABASE_URL } from './env';

test.describe('Login', () => {
  // Usa `page` y no `app`: sin sesión simulada
  test('sin sesión redirige al login y el botón va al authorize de Google', async ({ page }) => {
    await page.route(
      (url) => url.href.startsWith(`${E2E_SUPABASE_URL}/auth/v1/authorize`),
      (route) => route.fulfill({ contentType: 'text/html', body: '<p>Google</p>' }),
    );
    await page.goto('/');
    await expect(page).toHaveURL('/auth');
    const boton = page.getByRole('button', { name: 'Continuar con Google' });
    await expect(boton).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const origin = new URL(page.url()).origin;
    const authorize = page.waitForRequest((r) => r.url().startsWith(`${E2E_SUPABASE_URL}/auth/v1/authorize`));
    await boton.click();
    const url = new URL((await authorize).url());
    expect(url.searchParams.get('provider')).toBe('google');
    expect(url.searchParams.get('redirect_to')).toBe(`${origin}/`);
  });
});

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
    await app.goto('/?obra=OSDE&localidad=Belgrano');
    await expect(app.getByRole('combobox', { name: 'Filtrar por obra social' })).toHaveText('OSDE');
    await expect(app.getByRole('combobox', { name: 'Filtrar por localidad' })).toHaveText('Belgrano');

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

  test('cerrar el alta sin cambios no pregunta; con cambios, sí', async ({ app }) => {
    await app.goto('/');
    await app.getByRole('button', { name: 'Agregar paciente' }).click();
    const dialog = app.getByRole('dialog', { name: 'Agregar nuevo paciente' });
    await expect(dialog).toBeVisible();
    await app.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    await app.getByRole('button', { name: 'Agregar paciente' }).click();
    await dialog.getByLabel('Apellido').fill('Paz');
    await app.keyboard.press('Escape');
    const confirm = app.getByRole('alertdialog', { name: '¿Descartar cambios?' });
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: 'Descartar' }).click();
    await expect(dialog).toBeHidden();

    // Al reabrir arranca vacío
    await app.getByRole('button', { name: 'Agregar paciente' }).click();
    await expect(dialog.getByLabel('Apellido')).toHaveValue('');
  });

  test('si falla el guardado avisa qué hacer y conserva lo escrito', async ({ app }) => {
    await app.goto('/');
    await app.getByRole('button', { name: 'Agregar paciente' }).click();
    const dialog = app.getByRole('dialog', { name: 'Agregar nuevo paciente' });
    await dialog.getByLabel('Apellido').fill('Paz');
    await dialog.getByLabel('Nombre').fill('Julia');
    await dialog.getByLabel('Número de trámite').fill('00612345987');
    // El mock rechaza toda escritura; igual se verifica que el insert mande el trámite como texto
    const insert = app.waitForRequest((r) => r.method() === 'POST' && r.url().includes('/rest/v1/patients'));
    await dialog.getByRole('button', { name: 'Agregar paciente' }).click();
    expect((await insert).postDataJSON()).toMatchObject({ apellido: 'Paz', numero_tramite: '00612345987', documento: null });

    await expect(app.getByText('No se pudo guardar el paciente', { exact: true })).toBeVisible();
    await expect(app.getByText('Revisa tu conexión e intenta de nuevo. Lo que escribiste sigue en el formulario.', { exact: true })).toBeVisible();
    await expect(dialog.getByLabel('Número de trámite')).toHaveValue('00612345987');
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

  test('el alta limita el largo de los textos', async ({ app }) => {
    await app.goto('/');
    await app.getByRole('button', { name: 'Agregar paciente' }).click();
    const dialog = app.getByRole('dialog', { name: 'Agregar nuevo paciente' });

    await dialog.getByLabel('Apellido').fill('a'.repeat(101));
    await dialog.getByRole('button', { name: 'Agregar paciente' }).click();

    await expect(dialog.getByText('Máximo 100 caracteres')).toBeVisible();
  });
});

test.describe('Detalle de paciente', () => {
  test('pide confirmación antes de descartar una consulta a medio escribir', async ({ app }) => {
    await app.goto(`/patient/${PACIENTE.id}`);
    await app.getByRole('button', { name: 'Nueva consulta' }).click();
    const dialog = app.getByRole('dialog', { name: 'Nueva consulta' });
    await dialog.getByLabel('Notas').fill('Paciente refiere dolor lumbar…');

    // Click afuera del diálogo
    await app.mouse.click(5, 5);
    const confirm = app.getByRole('alertdialog', { name: '¿Descartar cambios?' });
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: 'Seguir editando' }).click();
    await expect(confirm).toBeHidden();
    await expect(dialog.getByLabel('Notas')).toHaveValue('Paciente refiere dolor lumbar…');

    await app.keyboard.press('Escape');
    await confirm.getByRole('button', { name: 'Descartar' }).click();
    await expect(dialog).toBeHidden();
  });

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

  test('fechas en hora local: edad la víspera del cumpleaños y fecha de consulta a la noche', async ({ app }) => {
    // 11/03/2026 a las 22:30 en Buenos Aires = 12/03 en UTC; cumple 78 recién mañana
    await app.clock.setFixedTime(new Date('2026-03-11T22:30:00-03:00'));
    await app.goto(`/patient/${PACIENTE.id}`);
    await expect(app.getByText('12/03/1948 · 77 años')).toBeVisible();

    await app.getByRole('button', { name: 'Nueva consulta' }).click();
    await expect(app.getByRole('dialog', { name: 'Nueva consulta' }).getByLabel('Fecha de la consulta')).toHaveValue('2026-03-11');
  });

  test('descarga la historia clínica en PDF', async ({ app }, testInfo) => {
    await app.goto(`/patient/${PACIENTE.id}`);
    await expect(app.getByText('2 consultas')).toBeVisible();
    const [download] = await Promise.all([
      app.waitForEvent('download'),
      app.getByRole('button', { name: 'Descargar PDF' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^historia-clinica-aguirre-marta-\d{4}-\d{2}-\d{2}\.pdf$/);
    const path = testInfo.outputPath(download.suggestedFilename());
    await download.saveAs(path);
    const { readFile } = await import('node:fs/promises');
    expect((await readFile(path)).subarray(0, 5).toString()).toBe('%PDF-');
  });

  test('un paciente inexistente vuelve a la lista', async ({ app }) => {
    await app.goto('/patient/no-existe');
    await expect(app).toHaveURL('/');
    await expect(app.getByText('No se pudieron cargar los datos del paciente', { exact: true })).toBeVisible();
  });
});

test.describe('Tema', () => {
  test('sigue al sistema por defecto y recuerda la elección', async ({ app }, testInfo) => {
    await app.emulateMedia({ colorScheme: 'dark' });
    await app.goto('/');
    const html = app.locator('html');
    await expect(html).toHaveClass(/dark/);

    const abrirMenu = async () => {
      if (testInfo.project.name === 'mobile') {
        await app.getByRole('button', { name: 'Mostrar u ocultar menú' }).first().click();
      }
    };
    await abrirMenu();
    const tema = app.getByRole('group', { name: 'Tema' });
    await expect(tema.getByRole('radio', { name: 'Sistema' })).toHaveAttribute('aria-checked', 'true');
    await tema.getByRole('radio', { name: 'Claro' }).click();
    await expect(html).not.toHaveClass(/dark/);

    await app.reload();
    await expect(html).not.toHaveClass(/dark/);
    await expectNoHorizontalOverflow(app);
  });
});
