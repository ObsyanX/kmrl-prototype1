import { useState, useEffect, useCallback } from 'react';
import { trainsetService } from '@/services/trainsetService';
import { useToast } from '@/hooks/use-toast';

export const useTrainsets = (autoFetch = true) => {
  const [trainsets, setTrainsets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTrainsets = useCallback(async (status?: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await trainsetService.getTrainsets(status);
      setTrainsets(data || []);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch trainsets';
      setError(errorMessage);
      toast({
        title: "Error Fetching Trainsets",
        description: errorMessage,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (autoFetch) {
      fetchTrainsets();
    }

    // Subscribe to real-time updates
    const unsubscribe = trainsetService.subscribeToTrainsets((payload) => {
      console.log('Trainset update:', payload);
      
      if (payload.eventType === 'INSERT') {
        setTrainsets(prev => [...prev, payload.new]);
      } else if (payload.eventType === 'UPDATE') {
        setTrainsets(prev =>
          prev.map(t => (t.id === payload.new.id ? payload.new : t))
        );
      } else if (payload.eventType === 'DELETE') {
        setTrainsets(prev => prev.filter(t => t.id !== payload.old.id));
      }

      toast({
        title: "Trainset Updated",
        description: `Trainset ${payload.new?.name || payload.old?.name} was ${payload.eventType.toLowerCase()}d.`,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [autoFetch, toast]);

  const getTrainsetById = useCallback(async (id: string) => {
    try {
      return await trainsetService.getTrainsetById(id);
    } catch (err: any) {
      toast({
        title: "Error Fetching Trainset",
        description: err.message || 'Failed to fetch trainset details',
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  const updateTrainset = useCallback(async (id: string, updates: any) => {
    try {
      const updated = await trainsetService.updateTrainset(id, updates);
      
      setTrainsets(prev =>
        prev.map(t => (t.id === id ? { ...t, ...updated } : t))
      );

      toast({
        title: "Trainset Updated",
        description: "Trainset information updated successfully.",
      });

      return updated;
    } catch (err: any) {
      toast({
        title: "Update Error",
        description: err.message || 'Failed to update trainset',
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  return {
    trainsets,
    loading,
    error,
    fetchTrainsets,
    getTrainsetById,
    updateTrainset,
  };
};
