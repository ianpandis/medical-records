# Cómo contribuir

¡Gracias por querer sumar! Esta guía es corta: lo importante está en el [README](README.md).

## Entorno

1. Node.js 22 (está en [`.nvmrc`](.nvmrc); con nvm: `nvm use`). Funciona desde Node 20.
2. `npm install`
3. Para correr la app contra una base necesitás un proyecto de Supabase propio y un `.env`: seguí la [instalación paso a paso del README](README.md#instalación-paso-a-paso). Usá un proyecto **de desarrollo con datos ficticios**, nunca la base con datos reales.

Para lint, tipos, build y tests e2e **no hace falta Supabase**.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run typecheck` | Chequeo de tipos de TypeScript |
| `npm run build` | Build de producción |
| `npm run test:e2e` | Tests e2e con Playwright |

Los tests e2e levantan Vite con un Supabase **simulado** (ver `e2e/env.ts` y `e2e/fixtures.ts`): pisan el `.env` local y **no tocan ninguna base real**. La primera vez instalá el navegador con `npx playwright install chromium`.

La CI corre los cuatro comandos en cada pull request; antes de abrir uno, verificá que pasen localmente.

## Commits

Prefijo tipo [Conventional Commits](https://www.conventionalcommits.org/es/) y mensaje en español, en minúscula y en infinitivo o descriptivo:

```
feat: descargar historia clínica del paciente en PDF
fix: fechas en zona horaria local
chore: ignorar .env, archivos de Supabase CLI y notas internas
docs: README de instalación, aviso legal y licencia MIT
```

Otros prefijos usados: `refactor:`, `test:`, `copy:` (textos de la interfaz). Un cambio lógico por commit.

## Cambios en la base

- Nunca edites una migración existente: agregá una **nueva** en `supabase/migrations/` con nombre `<timestamp>_nombre.sql` (por ejemplo `20260101120000_agregar_campo_alergias.sql`; `npx supabase migration new agregar_campo_alergias` la crea con el formato correcto).
- Toda tabla nueva tiene que tener **RLS habilitado** y políticas por usuario.
- Regenerá los tipos con `npx supabase gen types typescript --linked > src/integrations/supabase/types.ts`.

## Datos y claves

- **Nunca subas datos reales de pacientes**: ni en código, fixtures, capturas, issues ni PRs. Usá datos ficticios.
- **Nunca subas `.env`** ni claves (en especial la `service_role` key). `.env` ya está en `.gitignore`; si agregás una variable nueva, documentala en `.env.example` con un valor de ejemplo.

## Vulnerabilidades

Si encontrás un problema de seguridad, **no abras un issue público**. Reportalo en privado desde la pestaña **Security → [Report a vulnerability](https://github.com/ianpandis/medical-records/security/advisories/new)** del repo (GitHub Security Advisories).
