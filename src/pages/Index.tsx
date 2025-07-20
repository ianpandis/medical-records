import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-4xl font-bold tracking-tight">
          Medical Records System
        </h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          Manage your patients and their medical consultations efficiently.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => window.location.href = '/auth'}>
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
