import { supabase } from '@/integrations/supabase/client';

export const trainsetService = {
  /**
   * Fetch all trainsets with optional filters
   */
  async getTrainsets(status?: string) {
    let query = supabase.from('trainsets').select('*');
    
    if (status) {
      query = query.eq('status', status as any);
    }

    const { data, error } = await query.order('name');
    if (error) throw error;
    return data;
  },

  /**
   * Get trainset by ID with related data
   */
  async getTrainsetById(id: string) {
    const [
      { data: trainset, error: trainsetError },
      { data: maintenanceJobs, error: jobsError },
      { data: certificates, error: certsError },
      { data: mileageRecords, error: mileageError }
    ] = await Promise.all([
      supabase.from('trainsets').select('*').eq('id', id).single(),
      supabase.from('maintenance_jobs').select('*').eq('trainset_id', id),
      supabase.from('fitness_certificates').select('*').eq('trainset_id', id),
      supabase.from('mileage_records').select('*').eq('trainset_id', id).limit(30)
    ]);

    if (trainsetError) throw trainsetError;

    return {
      trainset,
      maintenanceJobs: maintenanceJobs || [],
      certificates: certificates || [],
      mileageRecords: mileageRecords || [],
    };
  },

  /**
   * Update trainset
   */
  async updateTrainset(id: string, updates: any) {
    const { data, error } = await supabase
      .from('trainsets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get maintenance jobs for trainset
   */
  async getMaintenanceJobs(trainsetId?: string, status?: string) {
    let query = supabase.from('maintenance_jobs').select('*');
    
    if (trainsetId) {
      query = query.eq('trainset_id', trainsetId);
    }

    if (status) {
      query = query.eq('status', status as any);
    }

    const { data, error } = await query.order('scheduled_start', { ascending: true });
    if (error) throw error;
    return data;
  },

  /**
   * Create maintenance job
   */
  async createMaintenanceJob(job: any) {
    const { data, error } = await supabase
      .from('maintenance_jobs')
      .insert(job)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update maintenance job status
   */
  async updateMaintenanceJob(id: string, updates: any) {
    const { data, error } = await supabase
      .from('maintenance_jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get fitness certificates
   */
  async getCertificates(trainsetId?: string) {
    let query = supabase.from('fitness_certificates').select('*');
    
    if (trainsetId) {
      query = query.eq('trainset_id', trainsetId);
    }

    const { data, error } = await query.order('expiry_date', { ascending: true });
    if (error) throw error;
    return data;
  },

  /**
   * Get stabling positions
   */
  async getStablingPositions(status?: string) {
    let query = supabase.from('stabling_positions').select('*');
    
    if (status) {
      query = query.eq('status', status as any);
    }

    const { data, error } = await query.order('position_name');
    if (error) throw error;
    return data;
  },

  /**
   * Get staff schedules
   */
  async getStaffSchedules(date?: string) {
    let query = supabase.from('staff_schedules').select('*');
    
    if (date) {
      query = query.eq('date', date);
    } else {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('date', today);
    }

    const { data, error } = await query.order('date').order('start_time');
    if (error) throw error;
    return data;
  },

  /**
   * Get branding contracts
   */
  async getBrandingContracts(status = 'active') {
    const { data, error } = await supabase
      .from('branding_contracts')
      .select('*')
      .eq('status', status)
      .order('priority_level', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Get mileage records with aggregation
   */
  async getMileageAnalysis(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('mileage_records')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0]);

    if (error) throw error;

    // Calculate aggregations
    const byTrainset: Record<string, any> = {};
    let totalMileage = 0;

    for (const record of data || []) {
      const trainsetId = record.trainset_id;
      if (!byTrainset[trainsetId]) {
        byTrainset[trainsetId] = {
          trainset_id: trainsetId,
          total_mileage: 0,
          days_tracked: 0,
          records: [],
        };
      }

      byTrainset[trainsetId].total_mileage += Number(record.daily_mileage);
      byTrainset[trainsetId].days_tracked++;
      byTrainset[trainsetId].records.push(record);
      totalMileage += Number(record.daily_mileage);
    }

    const trainsetArray = Object.values(byTrainset);
    const avgMileage = totalMileage / (trainsetArray.length || 1);

    return {
      total_mileage: totalMileage,
      average_mileage_per_trainset: avgMileage,
      trainset_analysis: trainsetArray.map(t => ({
        ...t,
        average_daily_mileage: t.total_mileage / (t.days_tracked || 1),
        deviation_from_fleet_avg: ((t.total_mileage / (t.days_tracked || 1)) - (avgMileage / days)) / (avgMileage / days || 1),
      })),
    };
  },

  /**
   * Subscribe to trainset updates
   */
  subscribeToTrainsets(callback: (payload: any) => void) {
    const channel = supabase
      .channel('trainsets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trainsets',
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribe to maintenance job updates
   */
  subscribeToMaintenanceJobs(callback: (payload: any) => void) {
    const channel = supabase
      .channel('maintenance-jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_jobs',
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
