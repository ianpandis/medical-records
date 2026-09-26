import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/BrandMark";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="flex max-w-sm flex-col items-center text-center">
        <BrandMark className="mb-6" />
        <p className="text-sm font-medium text-primary tabular-nums">Error 404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.01em]">Página no encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          La dirección <span className="break-all font-medium text-foreground">{location.pathname}</span> no existe o fue movida.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">
            <ArrowLeft aria-hidden="true" />
            Volver al inicio
          </Link>
        </Button>
      </div>
    </main>
  );
};

export default NotFound;
