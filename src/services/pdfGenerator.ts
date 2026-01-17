/**
 * PDF Generator Service for MetroMind
 * Generates formatted schedule PDFs with KMRL branding
 */

import jsPDF from 'jspdf';

export interface ScheduleItem {
  slotNumber: number;
  time: string;
  trainsetId: string;
  trainName: string;
  readinessScore: number;
  rationale: string;
  crew?: string[];
  platform?: string;
}

export interface InductionPlanData {
  date: string;
  shift: string;
  totalTrains: number;
  avgConfidence: number;
  plans: Array<{
    trainId: string;
    trainName: string;
    priority: string;
    stablingPosition: string;
    estimatedDuration: string;
    confidence: number;
    canProceed: boolean;
    crew: string[];
    blockingIssues: string[];
    reasoning: string;
  }>;
}

export interface ServiceScheduleData {
  date: string;
  isHoliday: boolean;
  departures: ScheduleItem[];
  summary: {
    totalTrains: number;
    avgReadiness: number;
    totalShuntingMoves: number;
  };
}

const COLORS = {
  primary: [0, 82, 147] as [number, number, number],      // KMRL Blue
  secondary: [41, 128, 185] as [number, number, number],  // Light Blue
  success: [39, 174, 96] as [number, number, number],     // Green
  warning: [243, 156, 18] as [number, number, number],    // Orange
  danger: [231, 76, 60] as [number, number, number],      // Red
  text: [44, 62, 80] as [number, number, number],         // Dark gray
  lightGray: [189, 195, 199] as [number, number, number], // Light gray
};

/**
 * Generate PDF for Induction Plan
 */
export function generateInductionPlanPDF(data: InductionPlanData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Header
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('KMRL TRAIN INDUCTION PLAN', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${data.date} | Shift: ${data.shift}`, pageWidth / 2, 32, { align: 'center' });

  yPos = 55;

  // Summary Box
  doc.setFillColor(240, 248, 255);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 30, 3, 3, 'F');

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');

  const summaryItems = [
    { label: 'Total Trains', value: data.totalTrains.toString() },
    { label: 'Avg AI Confidence', value: `${(data.avgConfidence * 100).toFixed(1)}%` },
    { label: 'Ready for Service', value: data.plans.filter(p => p.canProceed).length.toString() },
    { label: 'Blocked', value: data.plans.filter(p => !p.canProceed).length.toString() },
  ];

  const itemWidth = (pageWidth - 2 * margin) / summaryItems.length;
  summaryItems.forEach((item, i) => {
    const xPos = margin + itemWidth * i + itemWidth / 2;
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, xPos, yPos + 12, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(item.value, xPos, yPos + 22, { align: 'center' });
    doc.setFontSize(10);
  });

  yPos += 40;

  // Table Header
  doc.setFillColor(...COLORS.primary);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');

  const columns = [
    { header: 'Train', x: margin + 5 },
    { header: 'Priority', x: margin + 45 },
    { header: 'Position', x: margin + 75 },
    { header: 'Duration', x: margin + 105 },
    { header: 'Confidence', x: margin + 135 },
    { header: 'Status', x: margin + 165 },
  ];

  columns.forEach(col => {
    doc.text(col.header, col.x, yPos + 7);
  });

  yPos += 12;
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'normal');

  // Table Rows
  data.plans.forEach((plan, index) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = margin;
    }

    // Alternating row colors
    if (index % 2 === 0) {
      doc.setFillColor(248, 249, 250);
      doc.rect(margin, yPos - 3, pageWidth - 2 * margin, 10, 'F');
    }

    doc.setFontSize(8);
    doc.text(plan.trainName.substring(0, 15), columns[0].x, yPos + 3);
    
    // Priority badge color
    const priorityColor = plan.priority === 'high' ? COLORS.danger : 
                         plan.priority === 'normal' ? COLORS.success : COLORS.lightGray;
    doc.setTextColor(...priorityColor);
    doc.text(plan.priority.toUpperCase(), columns[1].x, yPos + 3);
    doc.setTextColor(...COLORS.text);

    doc.text(plan.stablingPosition, columns[2].x, yPos + 3);
    doc.text(plan.estimatedDuration, columns[3].x, yPos + 3);
    doc.text(`${(plan.confidence * 100).toFixed(0)}%`, columns[4].x, yPos + 3);

    const statusColor = plan.canProceed ? COLORS.success : COLORS.danger;
    doc.setTextColor(...statusColor);
    doc.text(plan.canProceed ? 'READY' : 'BLOCKED', columns[5].x, yPos + 3);
    doc.setTextColor(...COLORS.text);

    yPos += 10;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.lightGray);
  doc.text(
    `Generated by MetroMind AI | ${new Date().toLocaleString()}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  return doc;
}

/**
 * Generate PDF for Service Schedule
 */
export function generateServiceSchedulePDF(data: ServiceScheduleData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Header
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('KMRL SERVICE SCHEDULE', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const scheduleType = data.isHoliday ? 'Holiday Schedule (15 slots)' : 'Regular Schedule (10 slots)';
  doc.text(`${data.date} | ${scheduleType}`, pageWidth / 2, 32, { align: 'center' });

  yPos = 55;

  // Summary
  doc.setFillColor(240, 248, 255);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 25, 3, 3, 'F');
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(10);

  doc.setFont('helvetica', 'bold');
  doc.text(`Total Departures: ${data.summary.totalTrains}`, margin + 10, yPos + 10);
  doc.text(`Avg Readiness: ${data.summary.avgReadiness.toFixed(1)}%`, margin + 70, yPos + 10);
  doc.text(`Shunting Moves: ${data.summary.totalShuntingMoves}`, margin + 130, yPos + 10);

  yPos += 35;

  // Departure Table Header
  doc.setFillColor(...COLORS.primary);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');

  doc.text('Slot', margin + 5, yPos + 7);
  doc.text('Time', margin + 25, yPos + 7);
  doc.text('Train', margin + 55, yPos + 7);
  doc.text('Readiness', margin + 100, yPos + 7);
  doc.text('Rationale', margin + 130, yPos + 7);

  yPos += 12;

  // Departure Rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);

  data.departures.forEach((dep, index) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = margin;
    }

    if (index % 2 === 0) {
      doc.setFillColor(248, 249, 250);
      doc.rect(margin, yPos - 3, pageWidth - 2 * margin, 10, 'F');
    }

    doc.setFontSize(8);
    doc.text(dep.slotNumber.toString(), margin + 8, yPos + 3);
    
    const time = new Date(dep.time).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    doc.text(time, margin + 25, yPos + 3);
    doc.text(dep.trainName.substring(0, 20), margin + 55, yPos + 3);

    // Readiness color
    const readinessColor = dep.readinessScore >= 80 ? COLORS.success : 
                          dep.readinessScore >= 60 ? COLORS.warning : COLORS.danger;
    doc.setTextColor(...readinessColor);
    doc.text(`${dep.readinessScore.toFixed(0)}%`, margin + 105, yPos + 3);
    doc.setTextColor(...COLORS.text);

    // Truncate rationale
    const maxRationaleLength = 30;
    const rationale = dep.rationale.length > maxRationaleLength 
      ? dep.rationale.substring(0, maxRationaleLength) + '...'
      : dep.rationale;
    doc.text(rationale, margin + 130, yPos + 3);

    yPos += 10;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.lightGray);
  doc.text(
    `Generated by MetroMind AI | ${new Date().toLocaleString()}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  return doc;
}

/**
 * Download PDF
 */
export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

/**
 * Generate WhatsApp share link
 */
export function generateWhatsAppShareLink(
  scheduleType: 'induction' | 'service',
  date: string,
  summary: string
): string {
  const message = encodeURIComponent(
    `📋 KMRL ${scheduleType === 'induction' ? 'Induction Plan' : 'Service Schedule'}\n` +
    `📅 Date: ${date}\n\n` +
    `${summary}\n\n` +
    `Generated by MetroMind AI`
  );
  return `https://wa.me/?text=${message}`;
}

/**
 * Generate shareable text summary
 */
export function generateShareableText(
  data: InductionPlanData | ServiceScheduleData,
  type: 'induction' | 'service'
): string {
  if (type === 'induction') {
    const planData = data as InductionPlanData;
    return `KMRL Induction Plan - ${planData.date}\n` +
      `Total: ${planData.totalTrains} trains\n` +
      `Ready: ${planData.plans.filter(p => p.canProceed).length}\n` +
      `Blocked: ${planData.plans.filter(p => !p.canProceed).length}\n` +
      `AI Confidence: ${(planData.avgConfidence * 100).toFixed(1)}%`;
  } else {
    const scheduleData = data as ServiceScheduleData;
    return `KMRL Service Schedule - ${scheduleData.date}\n` +
      `Type: ${scheduleData.isHoliday ? 'Holiday' : 'Regular'}\n` +
      `Departures: ${scheduleData.summary.totalTrains}\n` +
      `Avg Readiness: ${scheduleData.summary.avgReadiness.toFixed(1)}%\n` +
      `Shunting Moves: ${scheduleData.summary.totalShuntingMoves}`;
  }
}

export const pdfGenerator = {
  generateInductionPlanPDF,
  generateServiceSchedulePDF,
  downloadPDF,
  generateWhatsAppShareLink,
  generateShareableText,
};
