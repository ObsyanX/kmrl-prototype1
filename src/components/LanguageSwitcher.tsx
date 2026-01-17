import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact';
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  variant = 'default',
  className 
}) => {
  const { locale, setLocale, locales, currentLocale } = useI18n();

  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLocale(locale === 'en' ? 'ml' : 'en')}
        className={cn("h-9 px-2 text-xs font-medium", className)}
        title={`Switch to ${locale === 'en' ? 'Malayalam' : 'English'}`}
      >
        <Globe className="w-4 h-4 mr-1.5" />
        <span className="hidden sm:inline">{currentLocale.code.toUpperCase()}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-9 gap-2", className)}
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">{currentLocale.nativeName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-40 glass-card bg-background/95 backdrop-blur-xl border-primary/20"
      >
        {locales.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              locale === lang.code && "bg-primary/10"
            )}
          >
            <div className="flex flex-col">
              <span className="font-medium">{lang.nativeName}</span>
              <span className="text-xs text-muted-foreground">{lang.name}</span>
            </div>
            {locale === lang.code && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
