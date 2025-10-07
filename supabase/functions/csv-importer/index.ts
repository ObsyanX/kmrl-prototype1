import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrainCSVRow {
  TrainID: string;
  Fitness_Rolling: string;
  Fitness_Signal: string;
  Fitness_Telecom: string;
  JobCard_Open: string;
  Mileage_km: string;
  Branding_Contract: string;
  Branding_Hours_Current: string;
  Branding_Hours_Required: string;
  Cleaning_Hours_Req: string;
  Home_Bay: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { csvContent } = await req.json();

    if (!csvContent) {
      throw new Error('CSV content is required');
    }

    console.log('Processing CSV import...');

    // Parse CSV
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map((h: string) => h.trim());
    
    // Validate headers
    const expectedHeaders = [
      'TrainID', 'Fitness_Rolling', 'Fitness_Signal', 'Fitness_Telecom',
      'JobCard_Open', 'Mileage_km', 'Branding_Contract', 'Branding_Hours_Current',
      'Branding_Hours_Required', 'Cleaning_Hours_Req', 'Home_Bay'
    ];

    const headersMatch = expectedHeaders.every(h => headers.includes(h));
    if (!headersMatch) {
      throw new Error(`Invalid CSV format. Expected headers: ${expectedHeaders.join(', ')}`);
    }

    const results = {
      trainsetsCreated: 0,
      certificatesCreated: 0,
      maintenanceJobsCreated: 0,
      brandingContractsCreated: 0,
      stablingPositionsCreated: 0,
      cleaningSchedulesCreated: 0,
      errors: [] as string[]
    };

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = line.split(',').map((v: string) => v.trim());
        const row: any = {};
        headers.forEach((header: string, index: number) => {
          row[header] = values[index];
        });

        const trainId = row.TrainID;
        console.log(`Processing trainset: ${trainId}`);

        // 1. Create/Update Trainset
        const { error: trainsetError } = await supabase
          .from('trainsets')
          .upsert({
            id: trainId,
            name: trainId,
            status: 'operational',
            total_mileage: parseInt(row.Mileage_km) || 0,
            operational_hours: parseInt(row.Branding_Hours_Current) || 0,
            current_stabling_position: row.Home_Bay,
            battery_level: 85 + Math.floor(Math.random() * 10),
            component_health_score: 85 + Math.random() * 15,
            current_location: row.Home_Bay,
            last_service_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            iot_sensor_alerts: []
          }, { onConflict: 'id' });

        if (trainsetError) {
          results.errors.push(`Trainset ${trainId}: ${trainsetError.message}`);
        } else {
          results.trainsetsCreated++;
        }

        // 2. Create Fitness Certificates
        const currentDate = new Date();
        const certificates = [
          {
            trainset_id: trainId,
            certificate_type: 'Rolling Stock',
            status: row.Fitness_Rolling.toLowerCase() === 'valid' ? 'valid' : 'expired',
            issue_date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
            expiry_date: row.Fitness_Rolling.toLowerCase() === 'valid'
              ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
              : new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            certificate_number: `CERT-RS-${trainId}-${Date.now()}`,
            issuing_authority: 'KMRL Safety Division'
          },
          {
            trainset_id: trainId,
            certificate_type: 'Signalling',
            status: row.Fitness_Signal.toLowerCase() === 'valid' ? 'valid' : 'expired',
            issue_date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
            expiry_date: row.Fitness_Signal.toLowerCase() === 'valid'
              ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
              : new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            certificate_number: `CERT-SG-${trainId}-${Date.now()}`,
            issuing_authority: 'KMRL Safety Division'
          },
          {
            trainset_id: trainId,
            certificate_type: 'Telecom',
            status: row.Fitness_Telecom.toLowerCase() === 'valid' ? 'valid' : 'expired',
            issue_date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
            expiry_date: row.Fitness_Telecom.toLowerCase() === 'valid'
              ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
              : new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            certificate_number: `CERT-TC-${trainId}-${Date.now()}`,
            issuing_authority: 'KMRL Safety Division'
          }
        ];

        const { error: certError } = await supabase
          .from('fitness_certificates')
          .upsert(certificates, { onConflict: 'certificate_number' });

        if (certError) {
          results.errors.push(`Certificates for ${trainId}: ${certError.message}`);
        } else {
          results.certificatesCreated += 3;
        }

        // 3. Create Maintenance Job if JobCard_Open is Yes
        if (row.JobCard_Open.toLowerCase() === 'yes') {
          const { error: jobError } = await supabase
            .from('maintenance_jobs')
            .insert({
              id: `JOB-${trainId}-${Date.now()}`,
              trainset_id: trainId,
              job_type: 'Scheduled Maintenance',
              priority: 'medium',
              status: 'pending',
              scheduled_start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              scheduled_end: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
              estimated_duration: 8,
              description: 'Open job card from CSV import'
            });

          if (jobError) {
            results.errors.push(`Job for ${trainId}: ${jobError.message}`);
          } else {
            results.maintenanceJobsCreated++;
          }
        }

        // 4. Create/Update Branding Contract
        if (row.Branding_Contract && row.Branding_Contract !== 'None') {
          const contractId = `BC-${row.Branding_Contract.toUpperCase()}`;
          
          // Check if contract exists
          const { data: existingContract } = await supabase
            .from('branding_contracts')
            .select('*')
            .eq('id', contractId)
            .single();

          if (!existingContract) {
            const { error: contractError } = await supabase
              .from('branding_contracts')
              .insert({
                id: contractId,
                client_name: row.Branding_Contract,
                status: 'active',
                contract_start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
                contract_end: new Date(Date.now() + 275 * 24 * 60 * 60 * 1000).toISOString(),
                assigned_trainsets: [trainId],
                priority_level: 5,
                revenue: 500000 + Math.random() * 500000,
                requirements: {
                  min_hours: parseInt(row.Branding_Hours_Required) || 0,
                  visibility_zones: ['all'],
                  exclusivity: true
                }
              });

            if (contractError) {
              results.errors.push(`Contract for ${row.Branding_Contract}: ${contractError.message}`);
            } else {
              results.brandingContractsCreated++;
            }
          } else {
            // Add trainset to existing contract
            const assignedTrainsets = existingContract.assigned_trainsets || [];
            if (!assignedTrainsets.includes(trainId)) {
              const { error: updateError } = await supabase
                .from('branding_contracts')
                .update({
                  assigned_trainsets: [...assignedTrainsets, trainId]
                })
                .eq('id', contractId);

              if (updateError) {
                results.errors.push(`Update contract for ${trainId}: ${updateError.message}`);
              }
            }
          }

          // Update trainset with branding contract
          await supabase
            .from('trainsets')
            .update({ branding_contract_id: contractId })
            .eq('id', trainId);
        }

        // 5. Create/Update Stabling Position
        const { error: stablingError } = await supabase
          .from('stabling_positions')
          .upsert({
            id: row.Home_Bay,
            position_name: row.Home_Bay,
            depot_section: row.Home_Bay.startsWith('B1') ? 'main' : 'north',
            position_type: 'storage',
            status: 'occupied',
            current_occupant: trainId,
            capacity: 1,
            track_number: parseInt(row.Home_Bay.replace(/\D/g, '')) || 1,
            facilities: ['charging', 'cleaning']
          }, { onConflict: 'id' });

        if (stablingError) {
          results.errors.push(`Stabling ${row.Home_Bay}: ${stablingError.message}`);
        } else {
          results.stablingPositionsCreated++;
        }

        // 6. Create Cleaning Schedule
        const cleaningHours = parseInt(row.Cleaning_Hours_Req) || 2;
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + Math.floor(Math.random() * 7));

        const { error: cleaningError } = await supabase
          .from('cleaning_schedules')
          .insert({
            trainset_id: trainId,
            cleaning_type: cleaningHours > 2 ? 'deep_cleaning' : 'routine_cleaning',
            scheduled_date: scheduledDate.toISOString().split('T')[0],
            scheduled_time: '08:00:00',
            bay_number: row.Home_Bay,
            status: 'scheduled',
            notes: `Requires ${cleaningHours} hours of cleaning`
          });

        if (cleaningError) {
          results.errors.push(`Cleaning for ${trainId}: ${cleaningError.message}`);
        } else {
          results.cleaningSchedulesCreated++;
        }

      } catch (rowError) {
        const errorMessage = rowError instanceof Error ? rowError.message : 'Unknown error';
        results.errors.push(`Row ${i}: ${errorMessage}`);
        console.error(`Error processing row ${i}:`, rowError);
      }
    }

    console.log('CSV import completed:', results);

    return new Response(JSON.stringify({
      success: true,
      results,
      message: `Successfully imported ${results.trainsetsCreated} trainsets`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('CSV import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
