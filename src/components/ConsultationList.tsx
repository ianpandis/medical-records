import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Edit, Trash2, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ConsultationForm } from '@/components/ConsultationForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Consultation } from '@/pages/PatientDetail';

interface ConsultationListProps {
  consultations: Consultation[];
  loading: boolean;
  onConsultationUpdated: () => void;
}

export const ConsultationList = ({ consultations, loading, onConsultationUpdated }: ConsultationListProps) => {
  const { toast } = useToast();
  const [editingConsultation, setEditingConsultation] = useState<Consultation | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('consultas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Consulta eliminada correctamente",
      });
      onConsultationUpdated();
    } catch (error: any) {
      console.error('Error eliminando consulta:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la consulta",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (consultation: Consultation) => {
    setEditingConsultation(consultation);
    setShowEditDialog(true);
  };

  const handleEditSuccess = () => {
    setShowEditDialog(false);
    setEditingConsultation(null);
    onConsultationUpdated();
    toast({
      title: "Éxito",
      description: "Consulta actualizada correctamente",
    });
  };

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="space-y-3 p-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </Card>
        ))}
      </div>
    );
  }

  if (consultations.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-12 text-center">
        <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-muted">
          <FileText className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="font-medium">No hay consultas registradas</p>
        <p className="mt-1 text-sm text-muted-foreground">Las consultas que agregues aparecerán acá, de la más reciente a la más antigua.</p>
      </div>
    );
  }

  return (
    <>
      <ol className="space-y-3">
        {consultations.map((consultation) => {
          const fecha = format(parseISO(consultation.fecha), 'dd/MM/yyyy');
          return (
            <li key={consultation.id}>
              <Card className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <h3 className="flex items-center gap-2 text-sm font-semibold tabular-nums">
                      <Calendar className="size-4 text-muted-foreground" aria-hidden="true" />
                      <time dateTime={consultation.fecha}>{fecha}</time>
                    </h3>
                    {consultation.tipo && (
                      <Badge variant="secondary" className="font-medium">{consultation.tipo}</Badge>
                    )}
                  </div>
                  <div className="-mr-2 -mt-2 flex shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(consultation)}
                      aria-label={`Editar consulta del ${fecha}`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Edit aria-hidden="true" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deletingId === consultation.id}
                          aria-label={`Eliminar consulta del ${fecha}`}
                          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar la consulta del {fecha}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(consultation.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar consulta
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/85">
                  {consultation.notas}
                </p>
              </Card>
            </li>
          );
        })}
      </ol>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent aria-describedby={undefined} className="max-h-[90dvh] max-w-2xl overflow-y-auto overscroll-contain">
          <DialogHeader>
            <DialogTitle>Editar consulta</DialogTitle>
          </DialogHeader>
          {editingConsultation && (
            <ConsultationForm
              patientId={editingConsultation.patient_id}
              onSuccess={handleEditSuccess}
              initialData={{
                fecha: editingConsultation.fecha,
                notas: editingConsultation.notas,
                tipo: editingConsultation.tipo,
              }}
              consultationId={editingConsultation.id}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};