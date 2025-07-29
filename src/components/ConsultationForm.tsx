import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const consultationSchema = z.object({
  fecha: z.string().min(1, 'Fecha es requerida'),
  notas: z.string().min(1, 'Notas son requeridas'),
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
    handleSubmit,
    formState: { errors },
  } = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      fecha: initialData?.fecha ? new Date(initialData.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      notas: initialData?.notas || '',
    },
  });

  const onSubmit = async (data: ConsultationFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      const consultationData = {
        fecha: data.fecha,
        notas: data.notas,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="fecha">Fecha de la consulta *</Label>
        <Input
          id="fecha"
          type="date"
          {...register('fecha')}
          className={errors.fecha ? 'border-destructive' : ''}
        />
        {errors.fecha && (
          <p className="text-sm text-destructive mt-1">{errors.fecha.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="notes">Notas *</Label>
        <Textarea
          id="notas"
          {...register('notas')}
          rows={6}
          placeholder="Ingrese las notas de la consulta, diagnóstico, tratamiento, recomendaciones..."
          className={errors.notas ? 'border-destructive' : ''}
        />
        {errors.notas && (
          <p className="text-sm text-destructive mt-1">{errors.notas.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : consultationId ? 'Actualizar Consulta' : 'Agregar Consulta'}
        </Button>
      </div>
    </form>
  );
};