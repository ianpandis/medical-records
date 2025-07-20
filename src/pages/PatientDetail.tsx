import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Plus, Calendar, Phone, Mail, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Patient } from '@/pages/Dashboard';
import { PatientForm } from '@/components/PatientForm';
import { ConsultationList } from '@/components/ConsultationList';
import { ConsultationForm } from '@/components/ConsultationForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export interface Consultation {
  id: string;
  patient_id: string;
  date: string;
  notes: string;
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
      setPatient(data);
    } catch (error: any) {
      console.error('Error fetching patient:', error);
      toast({
        title: "Error",
        description: "Failed to load patient details",
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
        .from('consultations')
        .select('*')
        .eq('patient_id', id)
        .order('date', { ascending: false });

      if (error) throw error;
      setConsultations(data || []);
    } catch (error) {
      console.error('Error fetching consultations:', error);
      toast({
        title: "Error",
        description: "Failed to load consultations",
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
      title: "Success",
      description: "Patient updated successfully",
    });
  };

  const handleConsultationAdded = () => {
    fetchConsultations();
    setShowAddConsultation(false);
    toast({
      title: "Success",
      description: "Consultation added successfully",
    });
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
            <p className="text-muted-foreground">Patient not found</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Go Back
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
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Patient Details</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Patient Information */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">
                    {patient.name} {patient.lastname}
                  </CardTitle>
                  <CardDescription>
                    <Badge variant="outline">ID: {patient.document}</Badge>
                  </CardDescription>
                </div>
                <Dialog open={showEditPatient} onOpenChange={setShowEditPatient}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Patient
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Edit Patient</DialogTitle>
                    </DialogHeader>
                    <PatientForm 
                      onSuccess={handlePatientUpdated}
                      initialData={{
                        name: patient.name,
                        lastname: patient.lastname,
                        date_of_birth: patient.date_of_birth,
                        document: patient.document,
                        phone: patient.phone || '',
                        email: patient.email || '',
                        address: patient.address || '',
                      }}
                      patientId={patient.id}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Born: {format(new Date(patient.date_of_birth), 'MMMM dd, yyyy')}</span>
                </div>
                {patient.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.phone}</span>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.email}</span>
                  </div>
                )}
                {patient.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Consultations */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Medical Consultations</CardTitle>
                  <CardDescription>
                    History of consultations for this patient
                  </CardDescription>
                </div>
                <Dialog open={showAddConsultation} onOpenChange={setShowAddConsultation}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Consultation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Consultation</DialogTitle>
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