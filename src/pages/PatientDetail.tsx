import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Plus, Calendar, Phone, Mail, MapPin, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Patient } from '@/pages/Dashboard';
import { PatientForm } from '@/components/PatientForm';
import { ConsultationList } from '@/components/ConsultationList';
import { ConsultationForm } from '@/components/ConsultationForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export interface Consultation {
  id: string;
  patient_id: string;
  fecha: string;
  notas: string;
  created_at: string;
  updated_at: string;
}

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [consultationsLoading, setConsultationsLoading] = useState(true);
  const [showEditPatient, setShowEditPatient] = useState(false);
  const [showAddConsultation, setShowAddConsultation] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPatient();
      fetchConsultations();
    }
  }, [id]);

  const fetchPatient = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setPatient(data as Patient);
    } catch (error: any) {
      console.error('Error fetching patient:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar los detalles del paciente",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultations = async () => {
    try {
      const { data, error } = await supabase
        .from('consultas')
        .select('*')
        .eq('patient_id', id)
        .order('fecha', { ascending: false });

      if (error) throw error;
      setConsultations(data || []);
    } catch (error) {
      console.error('Error fetching consultations:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar las consultas",
        variant: "destructive",
      });
    } finally {
      setConsultationsLoading(false);
    }
  };

  const handlePatientUpdated = () => {
    fetchPatient();
    setShowEditPatient(false);
    toast({
      title: "Éxito",
      description: "Paciente actualizado correctamente",
    });
  };

  const handleConsultationAdded = () => {
    fetchConsultations();
    setShowAddConsultation(false);
    toast({
      title: "Éxito",
      description: "Consulta agregada correctamente",
    });
  };

  const handleDeletePatient = async () => {
    if (!patient?.id) return;
    
    setDeleteLoading(true);
    try {
      // Primero eliminar todas las consultas del paciente
      const { error: consultationsError } = await supabase
        .from('consultas')
        .delete()
        .eq('patient_id', patient.id);

      if (consultationsError) throw consultationsError;

      // Luego eliminar el paciente
      const { error: patientError } = await supabase
        .from('patients')
        .delete()
        .eq('id', patient.id);

      if (patientError) throw patientError;

      toast({
        title: "Éxito",
        description: "Paciente eliminado correctamente",
      });

      // Navegar de vuelta al dashboard
      navigate('/');
    } catch (error: any) {
      console.error('Error eliminando paciente:', error);
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el paciente",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-8 w-64" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Paciente no encontrado</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Panel
          </Button>
          <h1 className="text-2xl font-bold">Detalles del Paciente</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Información del Paciente */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">
                    {patient.apellido} {patient.nombre}
                  </CardTitle>
                  <CardDescription>
                    <div className="flex flex-wrap gap-2">
                      {patient.documento && patient.tipo_documento && (
                        <Badge variant="outline">Documento: {patient.documento} ({patient.tipo_documento})</Badge>
                      )}
                      {patient.obra_social && (
                        <Badge variant="secondary">{patient.obra_social}</Badge>
                      )}
                    </div>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={showEditPatient} onOpenChange={setShowEditPatient}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Editar Paciente</DialogTitle>
                    </DialogHeader>
                    <PatientForm 
                      onSuccess={handlePatientUpdated}
                      initialData={{
                        name: patient.nombre || '',
                        lastname: patient.apellido || '',
                        date_of_birth: patient.fecha_nacimiento || '',
                        document: patient.documento?.toString() || '',
                        tipo_documento: patient.tipo_documento || undefined,
                        numero_tramite: patient.numero_tramite?.toString() || '',
                        numero_afiliado: patient.numero_afiliado?.toString() || '',
                        obra_social: patient.obra_social || undefined,
                        phone: patient.telefono || '',
                        email: patient.email || '',
                        address: patient.direccion || '',
                      }}
                      patientId={patient.id}
                    />
                  </DialogContent>
                </Dialog>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente al paciente "{patient.apellido} {patient.nombre}" y todas sus consultas asociadas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeletePatient}
                        disabled={deleteLoading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteLoading ? "Eliminando..." : "Eliminar"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patient.fecha_nacimiento && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Fecha de nacimiento: {format(parseISO(patient.fecha_nacimiento), 'dd/MM/yyyy')}</span>
                  </div>
                )}
                {patient.numero_tramite && (
                  <div className="flex items-center gap-2">
                    <span>Número de trámite: {patient.numero_tramite}</span>
                  </div>
                )}
                {patient.numero_afiliado && (
                  <div className="flex items-center gap-2">
                    <span>Número de afiliado: {patient.numero_afiliado}</span>
                  </div>
                )}
                {patient.telefono && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.telefono}</span>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.email}</span>
                  </div>
                )}
                {patient.direccion && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.direccion}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Consultas */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Consultas Médicas</CardTitle>
                  <CardDescription>
                    Historial de consultas de este paciente
                  </CardDescription>
                </div>
                <Dialog open={showAddConsultation} onOpenChange={setShowAddConsultation}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Consulta
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Agregar Nueva Consulta</DialogTitle>
                    </DialogHeader>
                    <ConsultationForm 
                      patientId={id!}
                      onSuccess={handleConsultationAdded}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <ConsultationList 
                consultations={consultations}
                loading={consultationsLoading}
                onConsultationUpdated={fetchConsultations}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PatientDetail;