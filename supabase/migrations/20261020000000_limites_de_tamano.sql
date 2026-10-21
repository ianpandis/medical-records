-- Largo máximo de los textos libres, para que un cliente no pueda guardar valores enormes
-- salteándose el formulario. Los mismos límites valida zod en el frontend (LIMITES en
-- src/lib/patient.ts): si cambiás uno, cambiá el otro.

alter table public.patients
  add constraint patients_nombre_largo check (char_length(nombre) <= 100),
  add constraint patients_apellido_largo check (char_length(apellido) <= 100),
  add constraint patients_documento_largo check (char_length(documento) <= 20),
  add constraint patients_numero_tramite_largo check (char_length(numero_tramite) <= 20),
  add constraint patients_numero_afiliado_largo check (char_length(numero_afiliado) <= 30),
  add constraint patients_telefono_largo check (char_length(telefono) <= 50),
  add constraint patients_email_largo check (char_length(email) <= 254),
  add constraint patients_direccion_largo check (char_length(direccion) <= 500);

alter table public.consultas
  add constraint consultas_notas_largo check (char_length(notas) <= 20000);
