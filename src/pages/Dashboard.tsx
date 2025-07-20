import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, LogOut, User } from 'lucide-react';
import { PatientList } from '@/components/PatientList';
import { PatientForm } from '@/components/PatientForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export interface Patient {
  id: string;
  name: string;
  lastname: string;
  date_of_birth: string;
  document: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddPatient, setShowAddPatient] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    `${patient.name} ${patient.lastname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.document.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePatientAdded = () => {
    fetchPatients();
    setShowAddPatient(false);
    toast({
      title: "Success",
      description: "Patient added successfully",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Medical Records System</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm">{user?.email}</span>
            </div>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient Management</CardTitle>
              <CardDescription>
                Search for existing patients or add new ones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients by name or document..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Dialog open={showAddPatient} onOpenChange={setShowAddPatient}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Patient
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Patient</DialogTitle>
                    </DialogHeader>
                    <PatientForm onSuccess={handlePatientAdded} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <PatientList 
            patients={filteredPatients} 
            loading={loading}
            onPatientUpdated={fetchPatients}
          />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;