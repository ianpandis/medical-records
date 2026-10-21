-- Listas configurables por profesional: obras sociales, localidades y tipos de consulta.
--
-- Reemplaza los CHECK con valores fijos por tablas de catálogo que cada profesional edita
-- desde la pantalla "Listas" de la app. Las columnas de patients y consultas siguen
-- guardando el texto, pero ahora con una FK compuesta (user_id, nombre):
--   - solo se pueden usar opciones del propio profesional;
--   - renombrar una opción actualiza en cascada a los pacientes y consultas que la usan;
--   - una opción en uso no se puede borrar: se archiva (activo = false) y deja de ofrecerse.
-- Los usuarios existentes reciben los valores que tenían los CHECK; los nuevos empiezan
-- con las listas vacías.

-- Tablas ------------------------------------------------------------------------

create table public.obras_sociales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  nombre text not null,
  -- Tint del badge: tokens --tint-* de src/index.css
  color text not null default 'sky',
  orden integer not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  constraint obras_sociales_nombre_largo check (char_length(nombre) between 1 and 60 and nombre = btrim(nombre)),
  constraint obras_sociales_color_check check (color in ('sky', 'mint', 'peach', 'lavender', 'rose', 'lemon')),
  constraint obras_sociales_nombre_key unique (user_id, nombre)
);

create table public.localidades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  nombre text not null,
  orden integer not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  constraint localidades_nombre_largo check (char_length(nombre) between 1 and 60 and nombre = btrim(nombre)),
  constraint localidades_nombre_key unique (user_id, nombre)
);

create table public.tipos_consulta (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  nombre text not null,
  orden integer not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  constraint tipos_consulta_nombre_largo check (char_length(nombre) between 1 and 60 and nombre = btrim(nombre)),
  constraint tipos_consulta_nombre_key unique (user_id, nombre)
);

-- Sin duplicados que solo difieren en mayúsculas ("Pami" y "PAMI")
create unique index obras_sociales_nombre_ci_idx on public.obras_sociales (user_id, lower(nombre));
create unique index localidades_nombre_ci_idx on public.localidades (user_id, lower(nombre));
create unique index tipos_consulta_nombre_ci_idx on public.tipos_consulta (user_id, lower(nombre));

-- Permisos ----------------------------------------------------------------------

revoke all on public.obras_sociales, public.localidades, public.tipos_consulta from anon;

alter table public.obras_sociales enable row level security;
alter table public.localidades enable row level security;
alter table public.tipos_consulta enable row level security;

create policy "Ver obras sociales propias" on public.obras_sociales
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Crear obras sociales propias" on public.obras_sociales
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Actualizar obras sociales propias" on public.obras_sociales
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Borrar obras sociales propias" on public.obras_sociales
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Ver localidades propias" on public.localidades
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Crear localidades propias" on public.localidades
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Actualizar localidades propias" on public.localidades
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Borrar localidades propias" on public.localidades
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Ver tipos de consulta propios" on public.tipos_consulta
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Crear tipos de consulta propios" on public.tipos_consulta
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Actualizar tipos de consulta propios" on public.tipos_consulta
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Borrar tipos de consulta propios" on public.tipos_consulta
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Valores de los usuarios existentes (los que permitían los CHECK) -------------

insert into public.obras_sociales (user_id, nombre, color, orden)
select u.id, v.nombre, v.color, v.orden
from public.users u
cross join (values ('Pami', 'sky', 1), ('Ioma', 'mint', 2), ('Medife', 'peach', 3), ('Particular', 'lavender', 4))
  as v (nombre, color, orden);

insert into public.localidades (user_id, nombre, orden)
select u.id, v.nombre, v.orden
from public.users u
cross join (values ('Del Viso', 1), ('Garin', 2), ('Maquinista Savio', 3), ('Pilar', 4)) as v (nombre, orden);

insert into public.tipos_consulta (user_id, nombre, orden)
select u.id, v.nombre, v.orden
from public.users u
cross join (values ('Primer Consulta', 1), ('Segunda Consulta', 2), ('Domicilio', 3), ('Espontanea', 4))
  as v (nombre, orden);

-- De CHECK a FK -----------------------------------------------------------------

alter table public.patients
  drop constraint patients_obra_social_check,
  drop constraint patients_localidad_check,
  add constraint patients_obra_social_fkey foreign key (user_id, obra_social)
    references public.obras_sociales (user_id, nombre) on update cascade,
  add constraint patients_localidad_fkey foreign key (user_id, localidad)
    references public.localidades (user_id, nombre) on update cascade;

alter table public.consultas
  drop constraint consultas_tipo_check,
  add constraint consultas_tipo_fkey foreign key (user_id, tipo)
    references public.tipos_consulta (user_id, nombre) on update cascade;

-- Para que renombrar o borrar una opción no recorra toda la tabla
create index patients_obra_social_idx on public.patients (user_id, obra_social);
create index patients_localidad_idx on public.patients (user_id, localidad);
create index consultas_tipo_idx on public.consultas (user_id, tipo);
