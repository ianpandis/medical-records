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

const patientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  lastname: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  document: z.string().min(1, 'Document is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
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
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: initialData,
  });

  const onSubmit = async (data: PatientFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      const patientData = {
        name: data.name,
        lastname: data.lastname,
        date_of_birth: data.date_of_birth,
        document: data.document,
        user_id: user.id,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
      };

      if (patientId) {
        // Update existing patient
        const { error } = await supabase
          .from('patients')
          .update(patientData)
          .eq('id', patientId);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Patient updated successfully",
        });
      } else {
        // Create new patient
        const { error } = await supabase
          .from('patients')
          .insert(patientData);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Patient created successfully",
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving patient:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save patient",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            {...register('name')}
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="lastname">Last Name *</Label>
          <Input
            id="lastname"
            {...register('lastname')}
            className={errors.lastname ? 'border-destructive' : ''}
          />
          {errors.lastname && (
            <p className="text-sm text-destructive mt-1">{errors.lastname.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="date_of_birth">Date of Birth *</Label>
          <Input
            id="date_of_birth"
            type="date"
            {...register('date_of_birth')}
            className={errors.date_of_birth ? 'border-destructive' : ''}
          />
          {errors.date_of_birth && (
            <p className="text-sm text-destructive mt-1">{errors.date_of_birth.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="document">Document ID *</Label>
          <Input
            id="document"
            {...register('document')}
            className={errors.document ? 'border-destructive' : ''}
          />
          {errors.document && (
            <p className="text-sm text-destructive mt-1">{errors.document.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            {...register('phone')}
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && (
            <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          {...register('address')}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : patientId ? 'Update Patient' : 'Add Patient'}
        </Button>
      </div>
    </form>
  );
};