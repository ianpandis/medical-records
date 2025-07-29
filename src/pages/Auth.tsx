import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AuthPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get the current origin (localhost in dev, production URL in prod)
  const redirectUrl = window.location.origin + '/';

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sistema de Consultas Medicas</CardTitle>
          <CardDescription>
            Inicia sesión para acceder al sistema de consultas médicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              style: {
                button: {
                  background: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                },
                anchor: {
                  color: 'hsl(var(--primary))',
                },
              }
            }}
            providers={['google']}
            redirectTo={redirectUrl}
            onlyThirdPartyProviders={true}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;