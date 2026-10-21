import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { BrandMark } from '@/components/BrandMark';
import { GoogleIcon } from '@/components/GoogleIcon';

const AuthPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Si se vuelve con el botón atrás desde Google, la página sale del bfcache con el botón trabado
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setRedirecting(false);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  const signInWithGoogle = async () => {
    setRedirecting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      // Origen actual: localhost en desarrollo, la URL pública en producción
      options: { redirectTo: window.location.origin + '/' },
    });
    if (error) {
      console.error('Error signing in with Google:', error);
      toast({
        title: 'No se pudo iniciar sesión',
        description: 'Revisa tu conexión e intenta de nuevo.',
        variant: 'destructive',
      });
      setRedirecting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center space-y-3 pb-4 pt-8 text-center">
          <BrandMark className="size-11 rounded-xl [&_svg]:size-5" />
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-[-0.01em]">Consultas médicas</h1>
            <CardDescription>
              Inicia sesión para acceder al registro de pacientes y consultas.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-8">
          <Button
            type="button"
            className="min-h-11 w-full"
            onClick={signInWithGoogle}
            disabled={redirecting}
            aria-busy={redirecting}
          >
            {/* El logo de Google va sobre blanco; el spinner ocupa el mismo lugar */}
            <span className="flex size-6 items-center justify-center rounded-full bg-white text-primary">
              {redirecting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <GoogleIcon />}
            </span>
            Continuar con Google
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default AuthPage;
