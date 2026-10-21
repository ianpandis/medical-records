import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { maxTexto } from '@/lib/patient';
import { MAX_NOMBRE_OPCION, opcionesParaSelect } from '@/lib/catalogos';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useReportDirty } from '@/hooks/use-dirty-form';
import { useSaveConsultation } from '@/hooks/usePatientData';
import { useCatalogo } from '@/hooks/useCatalogos';
import { ListaVaciaHint } from '@/components/ListaVaciaHint';

// Radix Select no admite value=""; "Sin especificar" vuelve el campo a '' (el schema lo transforma a null)
const NONE = '__none__';

const consultationSchema = z.object({
  fecha: z.string().min(1, 'Fecha es requerida'),
  notas: z.string().min(1, 'Notas son requeridas').max(...maxTexto('notas')),
  // Opción de la lista configurable; la base valida que exista en la lista del profesional
  tipo: z.string().max(MAX_NOMBRE_OPCION).transform(val => val === '' ? undefined : val).optional(),
});

type ConsultationFormData = z.infer<typeof consultationSchema>;

interface ConsultationFormProps {
  patientId: string;
  onSuccess: () => void;
  initialData?: Partial<ConsultationFormData>;
  consultationId?: string;
}

export const ConsultationForm = ({ patientId, onSuccess, initialData, consultationId }: ConsultationFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const saveConsultation = useSaveConsultation(patientId, consultationId);
  const loading = saveConsultation.isPending;
  const { data: tiposConsulta } = useCatalogo('tipos_consulta');

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      // Fecha local: toISOString() es UTC y después de las 21 h (UTC-3) daba el día siguiente
      fecha: initialData?.fecha ?? format(new Date(), 'yyyy-MM-dd'),
      notas: initialData?.notas || '',
      tipo: initialData?.tipo || undefined,
    },
  });

  // Avisa al FormDialog para pedir confirmación antes de cerrar con cambios sin guardar
  useReportDirty(isDirty);

  const onSubmit = async (data: ConsultationFormData) => {
    if (!user) return;

    try {
      await saveConsultation.mutateAsync({
        fecha: data.fecha,
        notas: data.notas,
        tipo: data.tipo || null,
        patient_id: patientId,
        user_id: user.id,
      });
      onSuccess();
    } catch (error) {
      console.error('Error saving consultation:', error);
      toast({
        title: "No se pudo guardar la consulta",
        description: "Revisa tu conexión e intenta de nuevo. Lo que escribiste sigue en el formulario.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="fecha">
          Fecha de la consulta<span className="ml-0.5 text-destructive" aria-hidden="true">*</span>
        </Label>
        <Input
          id="fecha"
          type="date"
          aria-required="true"
          className="sm:max-w-xs tabular-nums"
          {...register('fecha')}
          aria-invalid={errors.fecha ? true : undefined}
          aria-describedby={errors.fecha ? 'fecha-error' : undefined}
        />
        {errors.fecha && (
          <p id="fecha-error" className="text-sm text-destructive" role="alert">{errors.fecha.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tipo">Tipo de consulta</Label>
        <Controller
          name="tipo"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value ?? ''}
              onValueChange={(value) => field.onChange(value === NONE ? '' : value)}
            >
              <SelectTrigger
                id="tipo"
                ref={field.ref}
                onBlur={field.onBlur}
                className={cn(!field.value && 'text-muted-foreground')}
              >
                <SelectValue placeholder="Seleccionar tipo de consulta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE} className="text-muted-foreground">Sin especificar</SelectItem>
                {opcionesParaSelect(tiposConsulta ?? [], initialData?.tipo).map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.tipo && (
          <p className="text-sm text-destructive">{errors.tipo.message}</p>
        )}
        {tiposConsulta?.length === 0 && <ListaVaciaHint catalogo="tipos_consulta" />}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notas">
          Notas<span className="ml-0.5 text-destructive" aria-hidden="true">*</span>
        </Label>
        <Textarea
          id="notas"
          aria-required="true"
          {...register('notas')}
          rows={8}
          placeholder="Notas de la consulta, diagnóstico, tratamiento, recomendaciones…"
          className="leading-relaxed"
          aria-invalid={errors.notas ? true : undefined}
          aria-describedby={errors.notas ? 'notas-error' : undefined}
        />
        {errors.notas && (
          <p id="notas-error" className="text-sm text-destructive" role="alert">{errors.notas.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
          {loading ? 'Guardando…' : consultationId ? 'Guardar cambios' : 'Agregar consulta'}
        </Button>
      </div>
    </form>
  );
};