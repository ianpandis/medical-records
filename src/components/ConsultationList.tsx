import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Edit, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
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
        .from('consultations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Consultation deleted successfully",
      });
      onConsultationUpdated();
    } catch (error: any) {
      console.error('Error deleting consultation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete consultation",
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
      title: "Success",
      description: "Consultation updated successfully",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (consultations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No consultations recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {consultations.map((consultation) => (
          <Card key={consultation.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(consultation.date), 'MMMM dd, yyyy')}
                  </CardTitle>
                  <CardDescription>
                    <Badge variant="secondary">
                      {format(new Date(consultation.created_at), 'MMM dd, yyyy - HH:mm')}
                    </Badge>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(consultation)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deletingId === consultation.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Consultation</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this consultation? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(consultation.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {consultation.notes}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Consultation</DialogTitle>
          </DialogHeader>
          {editingConsultation && (
            <ConsultationForm
              patientId={editingConsultation.patient_id}
              onSuccess={handleEditSuccess}
              initialData={{
                date: editingConsultation.date,
                notes: editingConsultation.notes,
              }}
              consultationId={editingConsultation.id}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};