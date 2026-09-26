import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { BrandMark } from '@/components/BrandMark';

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
    </main>
  );
};

export default AuthPage;