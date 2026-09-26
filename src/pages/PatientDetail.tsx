import { useState, useEffect, type ReactNode } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calcularEdad, toPatient } from '@/lib/patient';
import { ObraSocialBadge } from '@/components/ObraSocialBadge';
import { EmptyValue } from '@/components/EmptyValue';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Patient } from '@/pages/Dashboard';
import { PatientForm } from '@/components/PatientForm';
import { ConsultationList } from '@/components/ConsultationList';
import { ConsultationForm } from '@/components/ConsultationForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PageContent, PageHeader } from '@/components/AppShell';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export interface Consultation {
  id: string;
  patient_id: string;
  fecha: string;
  notas: string;
  tipo: 'Primer Consulta' | 'Segunda Consulta' | 'Domicilio' | 'Espontanea' | null;
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
      setPatient(toPatient(data));
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
      setConsultations((data || []) as Consultation[]);
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
      // Las consultas se borran en la base por ON DELETE CASCADE (consultas.patient_id),
      // así el borrado es atómico
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
      <>
        <PageHeader>
          <Skeleton className="h-4 w-48" />
        </PageHeader>
        <PageContent>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </PageContent>
      </>
    );
  }

  if (!patient) {
    return (
      <PageContent>
        <Card className="flex flex-col items-center px-6 py-14 text-center">
          <p className="font-medium">Paciente no encontrado</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/">Volver a pacientes</Link>
          </Button>
        </Card>
      </PageContent>
    );
  }

  return (
    <>
      <PageHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Pacientes</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{patient.apellido} {patient.nombre}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <PageContent>
        <div className="space-y-10">
          {/* Información del paciente */}
          <section aria-labelledby="patient-name" className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <h1 id="patient-name" className="text-2xl font-semibold tracking-[-0.02em]">
                  {patient.apellido} {patient.nombre}
                </h1>
                {(patient.documento || patient.obra_social) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {patient.documento && (
                      <Badge variant="outline" className="font-medium tabular-nums">
                        {patient.tipo_documento ?? 'Doc.'} {patient.documento}
                      </Badge>
                    )}
                    {patient.obra_social && <ObraSocialBadge obraSocial={patient.obra_social} />}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <Dialog open={showEditPatient} onOpenChange={setShowEditPatient}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Edit aria-hidden="true" />
                      Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent aria-describedby={undefined} className="max-h-[90dvh] max-w-2xl overflow-y-auto overscroll-contain">
                    <DialogHeader>
                      <DialogTitle>Editar paciente</DialogTitle>
                    </DialogHeader>
                    <PatientForm 
                      onSuccess={handlePatientUpdated}
                      initialData={{
                        name: patient.nombre || '',
                        lastname: patient.apellido || '',
                        date_of_birth: patient.fecha_nacimiento || '',
                        document: patient.documento ?? '',
                        tipo_documento: patient.tipo_documento || undefined,
                        numero_tramite: patient.numero_tramite ?? '',
                        numero_afiliado: patient.numero_afiliado ?? '',
                        obra_social: patient.obra_social || undefined,
                        localidad: patient.localidad || undefined,
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
                    <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 aria-hidden="true" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar a {patient.apellido} {patient.nombre}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente al paciente y todas sus consultas asociadas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeletePatient}
                        disabled={deleteLoading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteLoading ? "Eliminando…" : "Eliminar paciente"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <Card>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-5 p-5 sm:grid-cols-2 md:p-6 lg:grid-cols-4">
                <DataItem label="Fecha de nacimiento">
                  {patient.fecha_nacimiento && (
                    <>
                      {format(parseISO(patient.fecha_nacimiento), 'dd/MM/yyyy')}
                      <span className="text-muted-foreground"> · {calcularEdad(patient.fecha_nacimiento)} años</span>
                    </>
                  )}
                </DataItem>
                <DataItem label="Número de trámite">{patient.numero_tramite}</DataItem>
                <DataItem label="Número de afiliado">{patient.numero_afiliado}</DataItem>
                <DataItem label="Localidad" numeric={false}>{patient.localidad}</DataItem>
                <DataItem label="Teléfono">
                  {patient.telefono && (
                    <a href={`tel:${patient.telefono}`} className="underline-offset-4 hover:underline">{patient.telefono}</a>
                  )}
                </DataItem>
                <DataItem label="Email" numeric={false}>
                  {patient.email && (
                    <a href={`mailto:${patient.email}`} className="break-all underline-offset-4 hover:underline">{patient.email}</a>
                  )}
                </DataItem>
                <DataItem label="Dirección" numeric={false} className="sm:col-span-2">{patient.direccion}</DataItem>
              </dl>
            </Card>
          </section>

          {/* Consultas */}
          <section aria-labelledby="consultas-title" className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 id="consultas-title" className="text-lg font-semibold tracking-[-0.01em]">Consultas</h2>
                {!consultationsLoading && (
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {consultations.length === 0
                      ? 'Sin consultas registradas'
                      : `${consultations.length} ${consultations.length === 1 ? 'consulta' : 'consultas'}`}
                  </p>
                )}
              </div>
              <Dialog open={showAddConsultation} onOpenChange={setShowAddConsultation}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus aria-hidden="true" />
                    Nueva consulta
                  </Button>
                </DialogTrigger>
                <DialogContent aria-describedby={undefined} className="max-h-[90dvh] max-w-2xl overflow-y-auto overscroll-contain">
                  <DialogHeader>
                    <DialogTitle>Nueva consulta</DialogTitle>
                  </DialogHeader>
                  <ConsultationForm 
                    patientId={id!}
                    onSuccess={handleConsultationAdded}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <ConsultationList 
              consultations={consultations}
              loading={consultationsLoading}
              onConsultationUpdated={fetchConsultations}
            />
          </section>
        </div>
      </PageContent>
    </>
  );
};

export default PatientDetail;

// Patrón caption + valor: label chico/muted arriba, valor abajo
const DataItem = ({
  label,
  numeric = true,
  className,
  children,
}: {
  label: string;
  numeric?: boolean;
  className?: string;
  children?: ReactNode;
}) => {
  const empty = children === null || children === undefined || children === false || children === '';
  return (
    <div className={cn('min-w-0 space-y-1', className)}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className={cn('text-sm', numeric && 'tabular-nums')}>
        {empty ? <EmptyValue /> : children}
      </dd>
    </div>
  );
};
