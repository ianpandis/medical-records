# Migraciones históricas

Estas migraciones se generaron durante el desarrollo y **no recrean el schema en un proyecto nuevo**: algunas modifican tablas antes de crearlas y no reflejan la base real (por ejemplo, crean `profiles` en lugar de `users`).

Se conservan solo como referencia. Para crear la base usá `supabase/migrations/`, que tiene el schema completo en una sola migración.
