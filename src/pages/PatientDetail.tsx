import { useState, useEffect, type ReactNode } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Edit, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calcularEdad } from '@/lib/patient';
import { ObraSocialBadge } from '@/components/ObraSocialBadge';
import { EmptyValue } from '@/components/EmptyValue';
import { format, parseISO } from 'date-fns';
import { useConsultations, useDeletePatient, usePatient } from '@/hooks/usePatientData';
import { useToast } from '@/hooks/use-toast';
import type { Patient } from '@/lib/patient';
import { PatientForm } from '@/components/PatientForm';
import { ConsultationList } from '@/components/ConsultationList';
import { ConsultationForm } from '@/components/ConsultationForm';
import { FormDialog } from '@/components/FormDialog';
import { PageContent, PageHeader } from '@/components/AppShell';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Filtros de la lista de la que se vino (ver PatientList), para volver con los mismos
  const listSearch = (useLocation().state as { listSearch?: string } | null)?.listSearch ?? '';
  const { toast } = useToast();
  const { data: patient, isPending: loading, isError: patientError } = usePatient(id);
  const { data: consultations = [], isPending: consultationsLoading, isError: consultationsError } = useConsultations(id);
  const deletePatient = useDeletePatient();
  const deleteLoading = deletePatient.isPending;
  const [showEditPatient, setShowEditPatient] = useState(false);
  const [showAddConsultation, setShowAddConsultation] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!patientError) return;
    toast({
      title: "No se pudieron cargar los datos del paciente",
      description: "Revisa tu conexión e intenta abrirlo de nuevo desde la lista.",
      variant: "destructive",
    });
    navigate('/');
  }, [patientError, toast, navigate]);

  useEffect(() => {
    if (!consultationsError) return;
    toast({
      title: "No se pudieron cargar las consultas",
      description: "Revisa tu conexión y recarga la página.",
      variant: "destructive",
    });
  }, [consultationsError, toast]);

  const handlePatientUpdated = () => {
    setShowEditPatient(false);
    toast({
      title: "Éxito",
      description: "Paciente actualizado correctamente",
    });
  };

  const handleConsultationAdded = () => {
    setShowAddConsultation(false);
    toast({
      title: "Éxito",
      description: "Consulta agregada correctamente",
    });
  };

  const handleDeletePatient = () => {
    if (!patient?.id) return;

    deletePatient.mutate(patient.id, {
      onSuccess: () => {
        toast({
          title: "Éxito",
          description: "Paciente eliminado correctamente",
        });
        navigate('/');
      },
      onError: (error) => {
        console.error('Error eliminando paciente:', error);
        toast({
          title: "No se pudo eliminar el paciente",
          description: "Revisa tu conexión e intenta de nuevo. No se borró ningún dato.",
          variant: "destructive",
        });
      },
    });
  };

  const handleDownloadPdf = async () => {
    if (!patient) return;
    setDownloading(true);
    try {
      const { descargarHistoriaClinica } = await import('@/lib/historia-clinica-pdf');
      await descargarHistoriaClinica(patient, consultations);
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast({
        title: "No se pudo generar el PDF",
        description: "Revisa tu conexión e intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
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
                <Link to={{ pathname: '/', search: listSearch }}>Pacientes</Link>
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
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownloadPdf}
                  // Sin las consultas cargadas el PDF saldría incompleto
                  disabled={downloading || consultationsLoading || consultationsError}
                >
                  <Download aria-hidden="true" />
                  {downloading ? "Generando…" : "Descargar PDF"}
                </Button>
                <FormDialog
                  open={showEditPatient}
                  onOpenChange={setShowEditPatient}
                  title="Editar paciente"
                  trigger={
                    <Button variant="outline">
                      <Edit aria-hidden="true" />
                      Editar
                    </Button>
                  }
                >
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
                </FormDialog>

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
              <FormDialog
                open={showAddConsultation}
                onOpenChange={setShowAddConsultation}
                title="Nueva consulta"
                trigger={
                  <Button>
                    <Plus aria-hidden="true" />
                    Nueva consulta
                  </Button>
                }
              >
                <ConsultationForm 
                  patientId={id!}
                  onSuccess={handleConsultationAdded}
                />
              </FormDialog>
            </div>
            <ConsultationList
              patientId={id!}
              consultations={consultations}
              loading={consultationsLoading}
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
