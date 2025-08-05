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
  name: z.string().min(1, 'El nombre es requerido'),
  lastname: z.string().min(1, 'El apellido es requerido'),
  date_of_birth: z.string().optional(),
  document: z.string().optional(),
  tipo_documento: z.enum(['DNI', 'LE', 'LC']).or(z.literal('')).transform(val => val === '' ? undefined : val).optional(),
  numero_tramite: z.string().optional(),
  numero_afiliado: z.string().optional(),
  obra_social: z.enum(['Pami', 'Ioma', 'Medife', 'Particular']).or(z.literal('')).transform(val => val === '' ? undefined : val).optional(),
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
        nombre: data.name,
        apellido: data.lastname,
        documento: data.document && data.document.trim() !== '' ? parseInt(data.document, 10) : null,
        tipo_documento: data.tipo_documento || null,
        numero_tramite: data.numero_tramite && data.numero_tramite.trim() !== '' ? parseInt(data.numero_tramite, 10) : null,
        numero_afiliado: data.numero_afiliado && data.numero_afiliado.trim() !== '' ? parseInt(data.numero_afiliado, 10) : null,
        obra_social: data.obra_social || null,
        fecha_nacimiento: data.date_of_birth || null,
        user_id: user.id,
        email: data.email || null,
        telefono: data.phone || null,
        direccion: data.address || null,
      };

      if (patientId) {
        // Update existing patient
        const { error } = await supabase
          .from('patients')
          .update(patientData)
          .eq('id', patientId);

        if (error) throw error;
        toast({
          title: "Éxito",
          description: "Paciente actualizado correctamente",
        });
      } else {
        // Create new patient
        const { error } = await supabase
          .from('patients')
          .insert(patientData);

        if (error) throw error;
        toast({
          title: "Éxito",
          description: "Paciente creado correctamente",
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving patient:', error);
      toast({
        title: "Error",
        description: error.message || "Error al guardar el paciente",
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
          <Label htmlFor="name">Nombre *</Label>
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
          <Label htmlFor="lastname">Apellido *</Label>
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
          <Label htmlFor="date_of_birth">Fecha de Nacimiento</Label>
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
          <Label htmlFor="document">Número de Documento</Label>
          <Input
            id="document"
            type="number"
            {...register('document')}
            className={errors.document ? 'border-destructive' : ''}
          />
          {errors.document && (
            <p className="text-sm text-destructive mt-1">{errors.document.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="tipo_documento">Tipo de Documento</Label>
          <select
            id="tipo_documento"
            {...register('tipo_documento')}
            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.tipo_documento ? 'border-destructive' : ''}`}
          >
            <option value="">Seleccionar tipo de documento</option>
            <option value="DNI">DNI</option>
            <option value="LE">LE</option>
            <option value="LC">LC</option>
          </select>
          {errors.tipo_documento && (
            <p className="text-sm text-destructive mt-1">{errors.tipo_documento.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="numero_tramite">Número de Trámite</Label>
          <Input
            id="numero_tramite"
            type="number"
            {...register('numero_tramite')}
            className={errors.numero_tramite ? 'border-destructive' : ''}
          />
          {errors.numero_tramite && (
            <p className="text-sm text-destructive mt-1">{errors.numero_tramite.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="numero_afiliado">Número de Afiliado</Label>
          <Input
            id="numero_afiliado"
            type="number"
            {...register('numero_afiliado')}
            className={errors.numero_afiliado ? 'border-destructive' : ''}
          />
          {errors.numero_afiliado && (
            <p className="text-sm text-destructive mt-1">{errors.numero_afiliado.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="obra_social">Obra Social</Label>
          <select
            id="obra_social"
            {...register('obra_social')}
            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.obra_social ? 'border-destructive' : ''}`}
          >
            <option value="">Seleccionar obra social</option>
            <option value="Pami">Pami</option>
            <option value="Ioma">Ioma</option>
            <option value="Medife">Medife</option>
            <option value="Particular">Particular</option>
          </select>
          {errors.obra_social && (
            <p className="text-sm text-destructive mt-1">{errors.obra_social.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Teléfono</Label>
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
        <Label htmlFor="address">Dirección</Label>
        <Textarea
          id="address"
          {...register('address')}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : patientId ? 'Actualizar Paciente' : 'Agregar Paciente'}
        </Button>
      </div>
    </form>
  );
};