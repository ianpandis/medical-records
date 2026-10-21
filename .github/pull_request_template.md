## Qué cambia

<!-- Descripción corta del cambio y por qué. Si cierra un issue: "Closes #123". -->

## Cómo se probó

<!-- Pasos para verificarlo o qué tests cubren el cambio. -->

## Checklist

- [ ] `npm run lint`, `npm run typecheck`, `npm run build` y `npm run test:e2e` pasan localmente.
- [ ] Los commits siguen la convención del repo (`feat:`, `fix:`, `chore:`, `docs:`… en español).
- [ ] Si cambia el esquema: hay una migración nueva en `supabase/migrations/` y regeneré `src/integrations/supabase/types.ts`.
- [ ] No incluye datos reales de pacientes, `.env` ni claves (tampoco en capturas).
