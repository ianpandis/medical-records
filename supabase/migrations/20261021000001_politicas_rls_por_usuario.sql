-- Políticas RLS por usuario en patients, consultas y users.
--
-- La base original tenía políticas que daban acceso total a una lista fija de emails
-- ("Allow Jorge and Ian on …") y las de perfil aplicaban al rol public sin
-- (select auth.uid()). Con esas políticas cada cuenta de la lista veía y modificaba los
-- datos de las otras. Esta migración las borra y deja las mismas políticas que
-- 20250720000000_schema_inicial.sql: cada profesional solo ve y modifica lo suyo.
-- En un proyecto creado desde el schema inicial no cambia nada (borra y recrea las mismas).

drop policy if exists "Allow Jorge and Ian on patients" on public.patients;
drop policy if exists "Allow Jorge and Ian on consultas" on public.consultas;
drop policy if exists "Allow Jorge and Ian on users" on public.users;
drop policy if exists "Users can view own profile" on public.users;
drop policy if exists "Users can update own profile" on public.users;

drop policy if exists "Ver el propio perfil" on public.users;
drop policy if exists "Actualizar el propio perfil" on public.users;
drop policy if exists "Ver pacientes propios" on public.patients;
drop policy if exists "Crear pacientes propios" on public.patients;
drop policy if exists "Actualizar pacientes propios" on public.patients;
drop policy if exists "Borrar pacientes propios" on public.patients;
drop policy if exists "Ver consultas propias" on public.consultas;
drop policy if exists "Crear consultas de pacientes propios" on public.consultas;
drop policy if exists "Actualizar consultas de pacientes propios" on public.consultas;
drop policy if exists "Borrar consultas propias" on public.consultas;

create policy "Ver el propio perfil" on public.users
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "Actualizar el propio perfil" on public.users
  for update to authenticated
  using ((select auth.uid()) = id);

create policy "Ver pacientes propios" on public.patients
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Crear pacientes propios" on public.patients
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Actualizar pacientes propios" on public.patients
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Borrar pacientes propios" on public.patients
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Ver consultas propias" on public.consultas
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Crear consultas de pacientes propios" on public.consultas
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.patients p where p.id = patient_id and p.user_id = (select auth.uid()))
  );

create policy "Actualizar consultas de pacientes propios" on public.consultas
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.patients p where p.id = patient_id and p.user_id = (select auth.uid()))
  );

create policy "Borrar consultas propias" on public.consultas
  for delete to authenticated
  using ((select auth.uid()) = user_id);
