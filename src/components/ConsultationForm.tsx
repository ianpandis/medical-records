import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const TIPOS_CONSULTA = ['Primer Consulta', 'Segunda Consulta', 'Domicilio', 'Espontanea'] as const;

// Radix Select no admite value=""; "Sin especificar" vuelve el campo a '' (el schema lo transforma a null)
const NONE = '__none__';

const consultationSchema = z.object({
  fecha: z.string().min(1, 'Fecha es requerida'),
  notas: z.string().min(1, 'Notas son requeridas'),
  tipo: z.enum(['Primer Consulta', 'Segunda Consulta', 'Domicilio', 'Espontanea']).or(z.literal('')).transform(val => val === '' ? undefined : val).optional(),
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
  const [loading, setLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      fecha: initialData?.fecha ? new Date(initialData.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      notas: initialData?.notas || '',
      tipo: initialData?.tipo || undefined,
    },
  });

  const onSubmit = async (data: ConsultationFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      const consultationData = {
        fecha: data.fecha,
        notas: data.notas,
        tipo: data.tipo || null,
        patient_id: patientId,
        user_id: user.id,
      };

      if (consultationId) {
        // Update existing consultation
        const { error } = await supabase
          .from('consultas')
          .update(consultationData)
          .eq('id', consultationId);

        if (error) throw error;
      } else {
        // Create new consultation
        const { error } = await supabase
          .from('consultas')
          .insert(consultationData);

        if (error) throw error;
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving consultation:', error);
      toast({
        title: "Error",
        description: error.message || "Error al guardar la consulta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
                {TIPOS_CONSULTA.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.tipo && (
          <p className="text-sm text-destructive">{errors.tipo.message}</p>
        )}
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