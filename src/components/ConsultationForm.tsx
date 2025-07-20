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
  date: z.string().min(1, 'Date is required'),
  notes: z.string().min(1, 'Notes are required'),
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
    defaultValues: initialData || {
      date: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: ConsultationFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      const consultationData = {
        date: data.date,
        notes: data.notes,
        patient_id: patientId,
        user_id: user.id,
      };

      if (consultationId) {
        // Update existing consultation
        const { error } = await supabase
          .from('consultations')
          .update(consultationData)
          .eq('id', consultationId);

        if (error) throw error;
      } else {
        // Create new consultation
        const { error } = await supabase
          .from('consultations')
          .insert(consultationData);

        if (error) throw error;
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving consultation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save consultation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="date">Consultation Date *</Label>
        <Input
          id="date"
          type="date"
          {...register('date')}
          className={errors.date ? 'border-destructive' : ''}
        />
        {errors.date && (
          <p className="text-sm text-destructive mt-1">{errors.date.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="notes">Notes *</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          rows={6}
          placeholder="Enter consultation notes, diagnosis, treatment, recommendations..."
          className={errors.notes ? 'border-destructive' : ''}
        />
        {errors.notes && (
          <p className="text-sm text-destructive mt-1">{errors.notes.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : consultationId ? 'Update Consultation' : 'Add Consultation'}
        </Button>
      </div>
    </form>
  );
};