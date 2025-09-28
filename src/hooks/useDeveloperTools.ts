import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeveloperConfig {
  debugMode: boolean;
  mockData: boolean;
  bypassEmailConfirmation: boolean;
  allowAnyEmail: boolean;
}

export const useDeveloperTools = () => {
  const [config, setConfig] = useState<DeveloperConfig>({
    debugMode: false,
    mockData: false,
    bypassEmailConfirmation: true, // Default to true for development
    allowAnyEmail: true, // Default to true for development
  });
  const { toast } = useToast();

  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV;

  useEffect(() => {
    // Load developer config from localStorage
    const savedConfig = localStorage.getItem('kmrl-dev-config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  const updateConfig = (newConfig: Partial<DeveloperConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    localStorage.setItem('kmrl-dev-config', JSON.stringify(updatedConfig));
    
    if (updatedConfig.debugMode) {
      console.log('Developer config updated:', updatedConfig);
    }
  };

  // Developer login bypass
  const developerLogin = async (email: string = 'developer@gmail.com', password: string = 'dev123456') => {
    if (!isDevelopment) {
      toast({
        title: "Developer Mode Disabled",
        description: "Developer login is only available in development mode.",
        variant: "destructive"
      });
      return { error: new Error('Developer mode not available') };
    }

    try {
      // First try to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        // If sign in fails, try to create the developer account
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              employee_id: 'KMRL000001',
              full_name: 'Developer User',
              department: 'it'
            }
          }
        });

        if (signUpError) {
          throw signUpError;
        }

        toast({
          title: "Developer Account Created",
          description: "A new developer account has been created and you're logged in.",
        });
      } else {
        toast({
          title: "Developer Login Success",
          description: "Logged in as developer user.",
        });
      }

      return { error: null };
    } catch (error) {
      console.error('Developer login error:', error);
      return { error };
    }
  };

  // Seed development data
  const seedDevelopmentData = async () => {
    if (!isDevelopment || !config.mockData) return;

    try {
      console.log('Seeding development data...');
      // This would normally seed trainsets, jobs, etc.
      // For now, just log that we would do this
      toast({
        title: "Development Data",
        description: "Mock data seeding would happen here in a real implementation.",
      });
    } catch (error) {
      console.error('Error seeding development data:', error);
    }
  };

  // Debug logging
  const debugLog = (message: string, data?: any) => {
    if (config.debugMode && isDevelopment) {
      console.log(`[KMRL DEBUG] ${message}`, data);
    }
  };

  return {
    config,
    updateConfig,
    isDevelopment,
    developerLogin,
    seedDevelopmentData,
    debugLog,
  };
};