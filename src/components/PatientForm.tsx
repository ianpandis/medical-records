import type { ReactNode } from 'react';
import { Controller, useForm, type Control, type FieldError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { cn, errorMessage } from '@/lib/utils';
import { LOCALIDADES, OBRAS_SOCIALES, SOLO_DIGITOS, TIPOS_DOCUMENTO } from '@/lib/patient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useReportDirty } from '@/hooks/use-dirty-form';
import { useSavePatient } from '@/hooks/usePatientData';

const patientSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  lastname: z.string().min(1, 'El apellido es requerido'),
  date_of_birth: z.string().optional(),
  document: z.string().trim().regex(SOLO_DIGITOS, 'Solo números, sin puntos ni espacios').optional(),
  tipo_documento: z.enum(['DNI', 'LE', 'LC']).or(z.literal('')).transform(val => val === '' ? undefined : val).optional(),
  numero_tramite: z.string().trim().regex(SOLO_DIGITOS, 'Solo números, sin puntos ni espacios').optional(),
  numero_afiliado: z.string().trim().regex(SOLO_DIGITOS, 'Solo números, sin puntos ni espacios').optional(),
  obra_social: z.enum(['Pami', 'Ioma', 'Medife', 'Particular']).or(z.literal('')).transform(val => val === '' ? undefined : val).optional(),
  localidad: z.enum(['Del Viso', 'Garin', 'Maquinista Savio', 'Pilar']).or(z.literal('')).transform(val => val === '' ? undefined : val).optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
  onSuccess: () => void;
  initialData?: Partial<PatientFormData>;
  patientId?: string;
}

export const PatientForm = ({ onSuccess, initialData, patientId }: PatientFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const savePatient = useSavePatient(patientId);
  const loading = savePatient.isPending;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: initialData,
  });

  // Avisa al FormDialog para pedir confirmación antes de cerrar con cambios sin guardar
  useReportDirty(isDirty);

  const onSubmit = async (data: PatientFormData) => {
    if (!user) return;

    try {
      await savePatient.mutateAsync({
        nombre: data.name,
        apellido: data.lastname,
        documento: data.document || null,
        tipo_documento: data.tipo_documento || null,
        numero_tramite: data.numero_tramite || null,
        numero_afiliado: data.numero_afiliado || null,
        obra_social: data.obra_social || null,
        localidad: data.localidad || null,
        fecha_nacimiento: data.date_of_birth || null,
        user_id: user.id,
        email: data.email || null,
        telefono: data.phone || null,
        direccion: data.address || null,
      });
      onSuccess();
    } catch (error) {
      console.error('Error saving patient:', error);
      toast({
        title: "Error",
        description: errorMessage(error, "Error al guardar el paciente"),
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <FormSection title="Datos personales">
        <Field id="lastname" label="Apellido" required error={errors.lastname?.message}>
          <Input
            id="lastname"
            autoComplete="off"
            aria-required="true"
            {...register('lastname')}
            {...invalidProps('lastname', errors.lastname)}
          />
        </Field>
        <Field id="name" label="Nombre" required error={errors.name?.message}>
          <Input
            id="name"
            autoComplete="off"
            aria-required="true"
            {...register('name')}
            {...invalidProps('name', errors.name)}
          />
        </Field>
        <Field id="date_of_birth" label="Fecha de nacimiento" error={errors.date_of_birth?.message}>
          <Input
            id="date_of_birth"
            type="date"
            {...register('date_of_birth')}
            {...invalidProps('date_of_birth', errors.date_of_birth)}
          />
        </Field>
        <Field id="localidad" label="Localidad" error={errors.localidad?.message}>
          <EnumSelect
            id="localidad"
            name="localidad"
            control={control}
            options={LOCALIDADES}
            placeholder="Seleccionar localidad"
            invalid={!!errors.localidad}
          />
        </Field>
      </FormSection>

      <FormSection title="Documentación">
        <Field id="tipo_documento" label="Tipo de documento" error={errors.tipo_documento?.message}>
          <EnumSelect
            id="tipo_documento"
            name="tipo_documento"
            control={control}
            options={TIPOS_DOCUMENTO}
            placeholder="Seleccionar tipo"
            invalid={!!errors.tipo_documento}
          />
        </Field>
        <Field id="document" label="Número de documento" error={errors.document?.message}>
          <Input
            id="document"
            inputMode="numeric"
            autoComplete="off"
            className="tabular-nums"
            {...register('document')}
            {...invalidProps('document', errors.document)}
          />
        </Field>
        <Field id="numero_tramite" label="Número de trámite" error={errors.numero_tramite?.message}>
          <Input
            id="numero_tramite"
            inputMode="numeric"
            autoComplete="off"
            className="tabular-nums"
            {...register('numero_tramite')}
            {...invalidProps('numero_tramite', errors.numero_tramite)}
          />
        </Field>
        <Field id="obra_social" label="Obra social" error={errors.obra_social?.message}>
          <EnumSelect
            id="obra_social"
            name="obra_social"
            control={control}
            options={OBRAS_SOCIALES}
            placeholder="Seleccionar obra social"
            invalid={!!errors.obra_social}
          />
        </Field>
        <Field id="numero_afiliado" label="Número de afiliado" error={errors.numero_afiliado?.message}>
          <Input
            id="numero_afiliado"
            inputMode="numeric"
            autoComplete="off"
            className="tabular-nums"
            {...register('numero_afiliado')}
            {...invalidProps('numero_afiliado', errors.numero_afiliado)}
          />
        </Field>
      </FormSection>

      <FormSection title="Contacto">
        <Field id="phone" label="Teléfono">
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            className="tabular-nums"
            {...register('phone')}
          />
        </Field>
        <Field id="email" label="Email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="off"
            spellCheck={false}
            {...register('email')}
            {...invalidProps('email', errors.email)}
          />
        </Field>
        <Field id="address" label="Dirección" className="md:col-span-2">
          <Input
            id="address"
            autoComplete="off"
            {...register('address')}
          />
        </Field>
      </FormSection>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
          {loading ? 'Guardando…' : patientId ? 'Guardar cambios' : 'Agregar paciente'}
        </Button>
      </div>
    </form>
  );
};

const FormSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <fieldset className="space-y-4">
    <div className="space-y-3">
      <legend className="text-sm font-semibold">{title}</legend>
      <Separator />
    </div>
    <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">{children}</div>
  </fieldset>
);

const Field = ({
  id,
  label,
  required,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}) => (
  <div className={cn('space-y-1.5', className)}>
    <Label htmlFor={id}>
      {label}
      {required && <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>}
    </Label>
    {children}
    {error && (
      <p id={`${id}-error`} className="text-sm text-destructive" role="alert">{error}</p>
    )}
  </div>
);

const invalidProps = (id: string, error?: FieldError) =>
  error
    ? { 'aria-invalid': true, 'aria-describedby': `${id}-error` }
    : {};

// Radix Select no admite value=""; "Sin especificar" vuelve el campo a '' (el schema lo transforma a null)
const NONE = '__none__';

const EnumSelect = ({
  id,
  name,
  control,
  options,
  placeholder,
  invalid,
}: {
  id: string;
  name: 'tipo_documento' | 'obra_social' | 'localidad';
  control: Control<PatientFormData>;
  options: readonly string[];
  placeholder: string;
  invalid?: boolean;
}) => (
  <Controller
    name={name}
    control={control}
    render={({ field }) => (
      <Select
        value={field.value ?? ''}
        onValueChange={(value) => field.onChange(value === NONE ? '' : value)}
      >
        <SelectTrigger
          id={id}
          ref={field.ref}
          onBlur={field.onBlur}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-error` : undefined}
          className={cn(!field.value && 'text-muted-foreground')}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE} className="text-muted-foreground">Sin especificar</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>{option}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
  />
);
