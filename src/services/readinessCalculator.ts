/**
 * MetroMind Readiness Score Calculator
 * Formula: 0.3×fitness + 0.3×jobs + 0.1×branding + 0.2×mileage + 0.1×cleaning
 * 
 * This calculates a composite readiness score for each trainset based on
 * multiple operational factors as per MetroMind specification.
 */

export interface ReadinessBreakdown {
  fitness_score: number;
  job_card_score: number;
  branding_score: number;
  mileage_score: number;
  cleaning_score: number;
  total_score: number;
  status_emoji: string;
  category: 'service' | 'standby' | 'maintenance' | 'ibl';
  blocking_reasons: string[];
}

export interface TrainsetData {
  id: string;
  train_id: string;
  name?: string;
  status: string;
  total_mileage?: number;
  battery_level?: number;
  operational_hours?: number;
}

export interface FitnessCertificate {
  trainset_id: string;
  certificate_type: string;
  expiry_date: string;
  is_valid: boolean;
}

export interface MaintenanceJob {
  trainset_id: string;
  job_type: string;
  priority: string;
  status: string;
}

export interface BrandingContract {
  trainset_id: string;
  hours_required: number;
  hours_current: number;
  status: string;
}

export interface CleaningSchedule {
  trainset_id: string;
  cleaning_type: string;
  status: string;
  scheduled_date: string;
}

export interface MileageRecord {
  trainset_id: string;
  mileage: number;
  daily_mileage?: number;
}

const WEIGHTS = {
  fitness: 0.3,
  jobs: 0.3,
  branding: 0.1,
  mileage: 0.2,
  cleaning: 0.1,
};

// Thresholds for categorization
const THRESHOLDS = {
  service: 70,    // Score >= 70 for service
  standby: 50,    // Score >= 50 for standby
  // Below 50 goes to maintenance/IBL
};

/**
 * Calculate fitness certificate score (0-100)
 * Returns 0 if any certificate is expired (hard constraint)
 */
export function calculateFitnessScore(
  certificates: FitnessCertificate[],
  trainsetId: string
): { score: number; isExpired: boolean; daysToExpiry: number | null } {
  const trainCerts = certificates.filter(c => c.trainset_id === trainsetId);
  
  if (trainCerts.length === 0) {
    return { score: 0, isExpired: true, daysToExpiry: null };
  }

  const now = new Date();
  let minDaysToExpiry = Infinity;
  let hasExpired = false;

  for (const cert of trainCerts) {
    if (!cert.is_valid) {
      hasExpired = true;
      break;
    }
    
    const expiryDate = new Date(cert.expiry_date);
    const daysToExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysToExpiry < 0) {
      hasExpired = true;
      break;
    }
    
    if (daysToExpiry < minDaysToExpiry) {
      minDaysToExpiry = daysToExpiry;
    }
  }

  if (hasExpired) {
    return { score: 0, isExpired: true, daysToExpiry: 0 };
  }

  // Score based on days to expiry
  // 100 if > 60 days, scales down to 0 at expiry
  let score: number;
  if (minDaysToExpiry >= 60) {
    score = 100;
  } else if (minDaysToExpiry >= 30) {
    score = 80 + ((minDaysToExpiry - 30) / 30) * 20;
  } else if (minDaysToExpiry >= 14) {
    score = 60 + ((minDaysToExpiry - 14) / 16) * 20;
  } else if (minDaysToExpiry >= 7) {
    score = 40 + ((minDaysToExpiry - 7) / 7) * 20;
  } else {
    score = (minDaysToExpiry / 7) * 40;
  }

  return { 
    score: Math.round(score), 
    isExpired: false, 
    daysToExpiry: minDaysToExpiry 
  };
}

/**
 * Calculate job card score (0-100)
 * Fewer open critical jobs = higher score
 */
export function calculateJobCardScore(
  jobs: MaintenanceJob[],
  trainsetId: string
): { score: number; openJobs: number; criticalJobs: number } {
  const trainJobs = jobs.filter(
    j => j.trainset_id === trainsetId && 
    (j.status === 'pending' || j.status === 'scheduled' || j.status === 'in_progress')
  );

  const criticalJobs = trainJobs.filter(j => j.priority === 'critical').length;
  const highJobs = trainJobs.filter(j => j.priority === 'high').length;
  const normalJobs = trainJobs.filter(j => j.priority === 'normal' || j.priority === 'low').length;

  // Penalty per job type
  const penalty = (criticalJobs * 30) + (highJobs * 15) + (normalJobs * 5);
  const score = Math.max(0, 100 - penalty);

  return {
    score: Math.round(score),
    openJobs: trainJobs.length,
    criticalJobs,
  };
}

/**
 * Calculate branding/SLA compliance score (0-100)
 */
export function calculateBrandingScore(
  contracts: BrandingContract[],
  trainsetId: string
): { score: number; compliance: number } {
  const trainContracts = contracts.filter(c => c.trainset_id === trainsetId);
  
  if (trainContracts.length === 0) {
    return { score: 100, compliance: 100 }; // No contracts = fully compliant
  }

  let totalRequired = 0;
  let totalCurrent = 0;

  for (const contract of trainContracts) {
    totalRequired += contract.hours_required || 0;
    totalCurrent += contract.hours_current || 0;
  }

  const compliance = totalRequired > 0 
    ? Math.min(100, (totalCurrent / totalRequired) * 100)
    : 100;

  return {
    score: Math.round(compliance),
    compliance: Math.round(compliance),
  };
}

/**
 * Calculate mileage balancing score (0-100)
 * Trains with balanced mileage score higher
 */
export function calculateMileageScore(
  records: MileageRecord[],
  trainsetId: string,
  fleetAvgMileage: number
): { score: number; deviation: number } {
  const trainRecords = records.filter(r => r.trainset_id === trainsetId);
  
  if (trainRecords.length === 0 || fleetAvgMileage === 0) {
    return { score: 80, deviation: 0 }; // Default score if no data
  }

  const latestMileage = trainRecords[0]?.mileage || 0;
  const deviation = Math.abs(latestMileage - fleetAvgMileage) / fleetAvgMileage;

  // Score inversely proportional to deviation from fleet average
  // 0% deviation = 100, 50% deviation = 50, 100% deviation = 0
  const score = Math.max(0, 100 - (deviation * 100));

  return {
    score: Math.round(score),
    deviation: Math.round(deviation * 100),
  };
}

/**
 * Calculate cleaning score (0-100)
 */
export function calculateCleaningScore(
  schedules: CleaningSchedule[],
  trainsetId: string
): { score: number; overdue: boolean; daysSinceLastClean: number } {
  const trainSchedules = schedules.filter(s => s.trainset_id === trainsetId);
  
  if (trainSchedules.length === 0) {
    return { score: 70, overdue: false, daysSinceLastClean: 0 };
  }

  const now = new Date();
  const completedCleans = trainSchedules.filter(s => s.status === 'completed');
  const pendingCleans = trainSchedules.filter(s => s.status === 'pending' || s.status === 'scheduled');

  // Check for overdue cleaning
  let overdue = false;
  for (const schedule of pendingCleans) {
    const scheduledDate = new Date(schedule.scheduled_date);
    if (scheduledDate < now) {
      overdue = true;
      break;
    }
  }

  // Calculate days since last cleaning
  let daysSinceLastClean = 999;
  for (const schedule of completedCleans) {
    const cleanDate = new Date(schedule.scheduled_date);
    const days = Math.floor((now.getTime() - cleanDate.getTime()) / (1000 * 60 * 60 * 24));
    if (days < daysSinceLastClean) {
      daysSinceLastClean = days;
    }
  }

  // Score calculation
  let score = 100;
  if (overdue) score -= 40;
  if (daysSinceLastClean > 7) score -= 20;
  if (daysSinceLastClean > 14) score -= 20;
  if (daysSinceLastClean > 30) score -= 20;

  return {
    score: Math.max(0, Math.round(score)),
    overdue,
    daysSinceLastClean: daysSinceLastClean === 999 ? 0 : daysSinceLastClean,
  };
}

/**
 * Get status emoji based on score
 */
export function getStatusEmoji(score: number): string {
  if (score >= 90) return '✅';
  if (score >= 70) return '🟢';
  if (score >= 50) return '🟡';
  if (score >= 30) return '🟠';
  return '🔴';
}

/**
 * Determine category based on score and blocking factors
 */
export function determineCategory(
  score: number,
  isExpired: boolean,
  hasCriticalJobs: boolean
): 'service' | 'standby' | 'maintenance' | 'ibl' {
  if (isExpired) return 'ibl'; // Involuntary Block Line
  if (hasCriticalJobs) return 'maintenance';
  if (score >= THRESHOLDS.service) return 'service';
  if (score >= THRESHOLDS.standby) return 'standby';
  return 'maintenance';
}

/**
 * Main function: Calculate complete readiness score for a trainset
 */
export function calculateReadinessScore(
  trainset: TrainsetData,
  certificates: FitnessCertificate[],
  jobs: MaintenanceJob[],
  contracts: BrandingContract[],
  mileageRecords: MileageRecord[],
  cleaningSchedules: CleaningSchedule[],
  fleetAvgMileage: number
): ReadinessBreakdown {
  // Calculate individual scores
  const fitness = calculateFitnessScore(certificates, trainset.id);
  const jobCards = calculateJobCardScore(jobs, trainset.id);
  const branding = calculateBrandingScore(contracts, trainset.id);
  const mileage = calculateMileageScore(mileageRecords, trainset.id, fleetAvgMileage);
  const cleaning = calculateCleaningScore(cleaningSchedules, trainset.id);

  // If certificate expired, total score is 0 (hard constraint)
  if (fitness.isExpired) {
    return {
      fitness_score: 0,
      job_card_score: jobCards.score,
      branding_score: branding.score,
      mileage_score: mileage.score,
      cleaning_score: cleaning.score,
      total_score: 0,
      status_emoji: '🔴',
      category: 'ibl',
      blocking_reasons: ['Fitness certificate expired or invalid'],
    };
  }

  // Calculate weighted total
  const totalScore = 
    (fitness.score * WEIGHTS.fitness) +
    (jobCards.score * WEIGHTS.jobs) +
    (branding.score * WEIGHTS.branding) +
    (mileage.score * WEIGHTS.mileage) +
    (cleaning.score * WEIGHTS.cleaning);

  // Collect blocking reasons
  const blockingReasons: string[] = [];
  if (fitness.daysToExpiry !== null && fitness.daysToExpiry < 7) {
    blockingReasons.push(`Fitness certificate expires in ${fitness.daysToExpiry} days`);
  }
  if (jobCards.criticalJobs > 0) {
    blockingReasons.push(`${jobCards.criticalJobs} critical maintenance job(s) pending`);
  }
  if (cleaning.overdue) {
    blockingReasons.push('Cleaning schedule overdue');
  }

  const category = determineCategory(
    totalScore,
    fitness.isExpired,
    jobCards.criticalJobs > 0
  );

  return {
    fitness_score: fitness.score,
    job_card_score: jobCards.score,
    branding_score: branding.score,
    mileage_score: mileage.score,
    cleaning_score: cleaning.score,
    total_score: Math.round(totalScore * 100) / 100,
    status_emoji: getStatusEmoji(totalScore),
    category,
    blocking_reasons: blockingReasons,
  };
}

/**
 * Calculate readiness for entire fleet
 */
export function calculateFleetReadiness(
  trainsets: TrainsetData[],
  certificates: FitnessCertificate[],
  jobs: MaintenanceJob[],
  contracts: BrandingContract[],
  mileageRecords: MileageRecord[],
  cleaningSchedules: CleaningSchedule[]
): Map<string, ReadinessBreakdown> {
  // Calculate fleet average mileage
  const allMileages = mileageRecords.map(r => r.mileage).filter(m => m > 0);
  const fleetAvgMileage = allMileages.length > 0
    ? allMileages.reduce((sum, m) => sum + m, 0) / allMileages.length
    : 0;

  const results = new Map<string, ReadinessBreakdown>();

  for (const trainset of trainsets) {
    const readiness = calculateReadinessScore(
      trainset,
      certificates,
      jobs,
      contracts,
      mileageRecords,
      cleaningSchedules,
      fleetAvgMileage
    );
    results.set(trainset.id, readiness);
  }

  return results;
}

/**
 * Sort trainsets by readiness for service scheduling
 */
export function sortByReadiness(
  readinessMap: Map<string, ReadinessBreakdown>
): Array<{ trainsetId: string; readiness: ReadinessBreakdown }> {
  return Array.from(readinessMap.entries())
    .map(([trainsetId, readiness]) => ({ trainsetId, readiness }))
    .sort((a, b) => b.readiness.total_score - a.readiness.total_score);
}
