-- Schema inicial de health-scribe-app.
--
-- Reproduce la estructura de la base en uso (tablas, columnas, restricciones y el
-- trigger de alta de usuarios) en un solo archivo, para crear un proyecto nuevo con
-- `supabase db push` o pegándolo en el SQL Editor.
--
-- Diferencias deliberadas con la base original:
--   - RLS por usuario: cada profesional solo ve y modifica sus propios pacientes y consultas.
--   - Una consulta solo puede asociarse a un paciente propio.
--   - Las políticas aplican al rol `authenticated` y `anon` no tiene permisos sobre las tablas.
--   - handle_new_user fija `search_path` y no se puede invocar por la API.
--   - consultas.user_id se borra en cascada con el usuario (la columna es NOT NULL).
--   - Índices sobre las claves foráneas.
-- Las migraciones anteriores quedan como referencia histórica en supabase/migrations_legacy/.

-- Tipos -------------------------------------------------------------------------

create type public.tipo_documento as enum ('DNI', 'LC', 'LE');

-- Tablas ------------------------------------------------------------------------

-- Perfil de cada usuario autenticado; lo completa el trigger on_auth_user_created
create table public.users (
  id uuid primary key default gen_random_uuid() references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  -- Sin cascada a propósito: no se puede borrar un usuario que todavía tiene pacientes,
  -- para que la historia clínica no se pierda por accidente
  user_id uuid references public.users (id),
  nombre text not null,
  apellido text not null,
  fecha_nacimiento date,
  tipo_documento public.tipo_documento,
  -- Identificadores como texto: conservan ceros a la izquierda
  documento text,
  numero_tramite text,
  numero_afiliado text,
  obra_social text,
  localidad text,
  telefono text,
  email text,
  direccion text,
  -- Valores propios del consultorio: para adaptarlos ver "Personalización" en el README
  constraint patients_obra_social_check
    check (obra_social = any (array['Pami', 'Ioma', 'Medife', 'Particular'])),
  constraint patients_localidad_check
    check (localidad = any (array['Del Viso', 'Garin', 'Maquinista Savio', 'Pilar']) or localidad is null)
);

create table public.consultas (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  fecha timestamptz not null default now(),
  notas text not null,
  tipo text,
  constraint consultas_tipo_check
    check (tipo = any (array['Primer Consulta', 'Segunda Consulta', 'Domicilio', 'Espontanea']) or tipo is null)
);

create index patients_user_id_idx on public.patients (user_id);
create index consultas_patient_id_idx on public.consultas (patient_id);
create index consultas_user_id_idx on public.consultas (user_id);

-- Permisos ----------------------------------------------------------------------

-- Sin sesión no se accede a nada; el resto lo resuelven las políticas RLS
revoke all on public.users, public.patients, public.consultas from anon;

alter table public.users enable row level security;
alter table public.patients enable row level security;
alter table public.consultas enable row level security;

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

-- Alta de usuarios --------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();
  return new;
end;
$$;

-- Solo la usa el trigger: no se puede llamar por /rest/v1/rpc
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
