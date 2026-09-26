import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const OPCIONES = [
  { value: 'light', label: 'Claro', Icon: Sun },
  { value: 'dark', label: 'Oscuro', Icon: Moon },
  { value: 'system', label: 'Sistema', Icon: Monitor },
] as const;

// Control segmentado Claro / Oscuro / Sistema (next-themes guarda la elección en localStorage)
export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={theme ?? 'system'}
      // Radix permite deseleccionar el activo (value ''); siempre tiene que haber uno
      onValueChange={(value) => value && setTheme(value)}
      aria-label="Tema"
      className="grid grid-cols-3 gap-1 rounded-lg bg-sidebar-accent p-1"
    >
      {OPCIONES.map(({ value, label, Icon }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          className="h-8 gap-1.5 rounded-md px-1.5 text-xs font-medium text-muted-foreground hover:bg-transparent hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
        >
          <Icon className="size-3.5 shrink-0" aria-hidden="true" />
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};
