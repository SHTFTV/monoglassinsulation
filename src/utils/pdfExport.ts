import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import {
  ASTM_TEST_RECORDS,
  ACOUSTIC_FREQUENCY_DATA,
  SUBSTRATE_GUIDES,
  COMPARISON_PRODUCTS,
} from '../data/monoglassData';
import { WatermarkPreset, CaseStudy, ScheduleInput, ScheduleEstimateResult, SavedProjectCostEstimate, CostEstimatorResult, CostEstimatorInput } from '../types';

export interface CsiSpecExportData {
  sectionCode: '07 21 29' | '09 81 00';
  projectName: string;
  thicknessInches: number;
  rValue: string;
  nrc: string;
  finishType: 'standard' | 'tamped' | 'tinted';
  requireBondTesting: boolean;
  requireFieldDensityTesting: boolean;
  notes?: string;
}

export interface CalculatorExportData {
  projectName?: string;
  squareFootage: number;
  thicknessInches: number;
  substrate: string;
  finishType: string;
  rValue: number;
  nrc: number;
  bagsNeeded: number;
  adhesivePailsNeeded: number;
  estimatedLaborDays: number;
  annualThermalSavingsEstimate?: number;
}

// Color Palette Constants for Clean Architectural Print
const COLORS = {
  primary: [15, 23, 42] as [number, number, number],      // Slate 900
  secondary: [2, 132, 199] as [number, number, number],   // Sky 600
  accent: [13, 148, 136] as [number, number, number],     // Teal 600
  darkSlate: [30, 41, 59] as [number, number, number],   // Slate 800
  lightGray: [248, 250, 252] as [number, number, number], // Slate 50
  borderGray: [203, 213, 225] as [number, number, number],// Slate 300
  textDark: [15, 23, 42] as [number, number, number],     // Slate 900
  textMuted: [100, 116, 139] as [number, number, number], // Slate 500
};

// Helper: Generates a high-quality QR Code data URL from DOM or canvas fallback
const getQrCodeDataUrl = (): Promise<string | null> => {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        resolve(null);
        return;
      }

      // Look for rendered QR SVG in DOM
      const existingSvg = document.querySelector('#print-qr-code-footer svg') as SVGGraphicsElement;
      if (existingSvg) {
        const svgData = new XMLSerializer().serializeToString(existingSvg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const objectUrl = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 200;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 200, 200);
            ctx.drawImage(img, 0, 0, 200, 200);
            const dataUrl = canvas.toDataURL('image/png');
            URL.revokeObjectURL(objectUrl);
            resolve(dataUrl);
            return;
          }
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        };
        img.src = objectUrl;
        return;
      }
      resolve(null);
    } catch {
      resolve(null);
    }
  });
};

// Helper: Adds a diagonal background watermark across the target PDF page
export const addWatermarkToPage = (
  doc: jsPDF,
  watermarkText: string | null | undefined,
  options?: {
    color?: [number, number, number];
    opacity?: number;
    fontSize?: number;
    angle?: number;
  }
) => {
  if (!watermarkText || watermarkText.trim() === '' || watermarkText === 'NONE') {
    return;
  }

  const text = watermarkText.trim().toUpperCase();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const isLandscape = pageWidth > pageHeight;
  const centerX = pageWidth / 2;
  const centerY = pageHeight / 2;

  doc.saveGraphicsState();
  try {
    if (typeof (doc as any).setGState === 'function' && (doc as any).GState) {
      doc.setGState(new (doc as any).GState({ opacity: options?.opacity ?? 0.085 }));
    }
  } catch {
    // fallback if GState is not available
  }

  doc.setFont('helvetica', 'bold');
  const defaultSize = isLandscape
    ? text.length > 25 ? 30 : 38
    : text.length > 25 ? 24 : 32;
  doc.setFontSize(options?.fontSize ?? defaultSize);

  const color = options?.color ?? [100, 116, 139]; // Slate 500
  doc.setTextColor(color[0], color[1], color[2]);

  const defaultAngle = isLandscape ? -24 : -35;
  const angle = options?.angle ?? defaultAngle;

  doc.text(text, centerX, centerY, {
    align: 'center',
    baseline: 'middle',
    angle: angle,
  });

  doc.restoreGraphicsState();
};

// Helper: Adds running header, footer with total page count, and document-level watermark
const addDocumentDecorations = (
  doc: jsPDF,
  _title: string,
  sectionCode: string = 'CSI 07 21 29 / 09 81 00',
  qrDataUrl: string | null = null,
  _currentUrl: string = 'https://monoglassinsulation.com',
  watermark: string | null = null
) => {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Apply Background Watermark across page
    if (watermark && watermark !== 'NONE') {
      addWatermarkToPage(doc, watermark);
    }

    // Top Running Header (Pages 2+)
    if (i > 1) {
      doc.setDrawColor(...COLORS.borderGray);
      doc.setLineWidth(0.5);
      doc.line(14, 14, pageWidth - 14, 14);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.textDark);
      doc.text('MONOGLASS® SPRAY INSULATION — ARCHITECTURAL SUBMITTAL', 14, 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.textMuted);
      doc.text(sectionCode, pageWidth - 14, 11, { align: 'right' });
    }

    // Bottom Running Footer
    const footerY = pageHeight - 12;
    doc.setDrawColor(...COLORS.borderGray);
    doc.setLineWidth(0.5);
    doc.line(14, footerY - 4, pageWidth - 14, footerY - 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.textDark);
    doc.text('MONOGLASS INCORPORATED', 14, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.textMuted);

    const footerSubtext = watermark && watermark !== 'NONE'
      ? `[STATUS: ${watermark.toUpperCase()}] • ASTM E84 Class A (0/0) • Generated ${dateStr}`
      : `ASTM E84 Class A (0/0) • ASTM E136 Non-Combustible • Generated ${dateStr}`;

    doc.text(
      footerSubtext,
      58,
      footerY
    );

    // Page Number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textDark);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, footerY, { align: 'right' });
  }

  // If QR code is available and we are on page 1, draw a QR badge on the header
  if (qrDataUrl) {
    try {
      doc.setPage(1);
      doc.addImage(qrDataUrl, 'PNG', pageWidth - 36, 14, 22, 22);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.textMuted);
      doc.text('SCAN FOR MOBILE', pageWidth - 25, 39, { align: 'center' });
    } catch {
      // Ignore if image fails
    }
  }
};

/**
 * 1. Export Complete Technical Guide Submittal Package
 */
export async function exportTechnicalGuidePdf(
  currentUrl: string = 'https://monoglassinsulation.com',
  watermark: string | null = 'PRELIMINARY SUBMITTAL'
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter', // 215.9 x 279.4 mm
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const qrDataUrl = await getQrCodeDataUrl();

  // Document Header Banner
  doc.setFillColor(...COLORS.primary);
  doc.rect(14, 14, pageWidth - 28 - (qrDataUrl ? 26 : 0), 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('MONOGLASS® SPRAY INSULATION', 18, 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(186, 230, 253); // Sky 200
  doc.text('MASTER TECHNICAL DATA & ARCHITECTURAL PERFORMANCE SUBMITTAL', 18, 29);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text('CSI SECTIONS: 07 21 29 (SPRAY INSULATION) & 09 81 00 (ACOUSTIC ABSORPTION)', 18, 34);

  let currentY = 44;

  // Executive Summary Callout Box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(...COLORS.secondary);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, currentY, pageWidth - 28, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.primary);
  doc.text('EXECUTIVE PRODUCT DESCRIPTION & HIGHLIGHTS', 18, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.darkSlate);
  const summaryText =
    'Monoglass® is an inorganic, 100% white glass fiber insulation spray-applied with a non-toxic polyvinyl water-based adhesive. It provides continuous thermal insulation (R-4.00/inch, k=0.250), exceptional acoustic reverberation control (NRC up to 0.95-1.00), and zero flame spread / zero smoke development (ASTM E84 0/0, ASTM E136 Non-Combustible). Applied up to 5" (R-20) in a single pass without mechanical fasteners.';
  doc.text(doc.splitTextToSize(summaryText, pageWidth - 36), 18, currentY + 10);

  currentY += 25;

  // Section 1: Key ASTM Test Data Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  doc.text('1. ASTM & CAN/ULC STANDARDS COMPLIANCE MATRIX', 14, currentY);
  currentY += 3;

  const astmTableData = ASTM_TEST_RECORDS.map((item) => [
    item.standard,
    item.ratingCategory,
    item.result,
    item.industrySignificance,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Standard', 'Category', 'Certified Performance Result', 'Engineering Significance']],
    body: astmTableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: COLORS.textDark,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold' },
      1: { cellWidth: 28, fontStyle: 'bold', textColor: COLORS.secondary },
      2: { cellWidth: 48, fontStyle: 'bold' },
      3: { cellWidth: 'auto' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Section 2: Acoustical NRC Absorption Matrix
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  doc.text('2. SOUND ABSORPTION COEFFICIENTS (ASTM C423 / TYPE A MOUNTING)', 14, currentY);
  currentY += 3;

  const acousticTableData = ACOUSTIC_FREQUENCY_DATA.map((item) => [
    item.thickness,
    item.freq125.toFixed(2),
    item.freq250.toFixed(2),
    item.freq500.toFixed(2),
    item.freq1000.toFixed(2),
    item.freq2000.toFixed(2),
    item.freq4000.toFixed(2),
    item.nrc.toFixed(2),
    (parseFloat(item.thickness) * 4.0).toFixed(1),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Thickness', '125 Hz', '250 Hz', '500 Hz', '1000 Hz', '2000 Hz', '4000 Hz', 'NRC', 'R-Value']],
    body: acousticTableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.darkSlate,
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: COLORS.textDark,
      halign: 'center',
      cellPadding: 1.8,
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left', cellWidth: 36 },
      7: { fontStyle: 'bold', textColor: COLORS.secondary, fillColor: [240, 249, 255] },
      8: { fontStyle: 'bold', textColor: COLORS.accent, fillColor: [240, 253, 250] },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Section 3: Substrate Application Matrix
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  doc.text('3. SUBSTRATE COMPATIBILITY & ADHESION SPECIFICATION', 14, currentY);
  currentY += 3;

  const substrateTableData = SUBSTRATE_GUIDES.map((item) => [
    item.name,
    item.primerRequired ? 'Required (Mono-Bind / Acrylic)' : 'None Required (Direct Spray)',
    item.adhesionNotes,
    item.recommendedMaxSinglePass,
    item.surfacePrep,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Substrate Type', 'Primer / Adhesive', 'Adhesion Notes', 'Max Single Pass', 'Surface Preparation Requirements']],
    body: substrateTableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 6.8,
      textColor: COLORS.textDark,
      cellPadding: 1.8,
    },
    columnStyles: {
      0: { cellWidth: 34, fontStyle: 'bold' },
      1: { cellWidth: 32 },
      2: { cellWidth: 38 },
      3: { cellWidth: 26, halign: 'center' },
      4: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Section 4: Architectural Approval Stamp Box
  if (currentY > 215) {
    doc.addPage();
    currentY = 24;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...COLORS.borderGray);
  doc.setLineWidth(0.8);
  doc.rect(14, currentY, pageWidth - 28, 42, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.primary);
  doc.text('ARCHITECT / ENGINEER SUBMITTAL REVIEW & APPROVAL STAMP', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Project Name: ____________________________________________________   Date: ________________________', 18, currentY + 13);
  doc.text('Contractor: ______________________________________________________   Spec Section: ________________', 18, currentY + 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.darkSlate);
  doc.text('[  ]  APPROVED          [  ]  APPROVED AS NOTED          [  ]  REVISE & RESUBMIT          [  ]  REJECTED', 18, currentY + 27);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Reviewer Signature: _____________________________________________   Comments: __________________________________________', 18, currentY + 36);

  // Decorate all pages with headers, footers & page numbers
  addDocumentDecorations(doc, 'Technical Guide Submittal', 'CSI 07 21 29 / 09 81 00', qrDataUrl, currentUrl, watermark);

  // Save the PDF
  doc.save(`Monoglass_Technical_Submittal_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * 2. Export CSI 3-Part MasterFormat Architectural Specification (07 21 29 / 09 81 00)
 */
export async function exportCsiSpecPdf(
  specData: CsiSpecExportData,
  currentUrl: string = 'https://monoglassinsulation.com',
  watermark: string | null = 'DRAFT - FOR REFERENCE ONLY'
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const qrDataUrl = await getQrCodeDataUrl();

  // Document Title Header
  doc.setFillColor(...COLORS.primary);
  doc.rect(14, 14, pageWidth - 28 - (qrDataUrl ? 26 : 0), 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(`CSI MASTERFORMAT SECTION ${specData.sectionCode}`, 18, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(186, 230, 253);
  doc.text(
    specData.sectionCode === '07 21 29'
      ? 'SPRAYED-APPLIED GLASS FIBER THERMAL INSULATION SPECIFICATION'
      : 'ACOUSTICAL ROOM SPRAY ABSORPTION SPECIFICATION',
    18,
    28
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`PROJECT: ${specData.projectName.toUpperCase()} | TARGET R-${specData.rValue} (NRC ${specData.nrc})`, 18, 34);

  let currentY = 44;

  // Project Parameters Metadata Block
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(...COLORS.borderGray);
  doc.rect(14, currentY, pageWidth - 28, 16, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.primary);
  doc.text('PROJECT SPECIFICATION PARAMETERS:', 18, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.darkSlate);
  doc.text(
    `Specified Thickness: ${specData.thicknessInches.toFixed(1)}"   |   Thermal Performance: R-${specData.rValue} (k=0.250)   |   Acoustic Performance: NRC ${specData.nrc}`,
    18,
    currentY + 10
  );
  doc.text(
    `Surface Finish: ${specData.finishType.toUpperCase()}   |   Adhesion Testing (ASTM E736): ${specData.requireBondTesting ? 'Required (>200 psf)' : 'Standard'}   |   Density: ${specData.requireFieldDensityTesting ? 'Field Testing Required' : 'Standard'}`,
    18,
    currentY + 14
  );

  currentY += 22;

  // Render CSI 3-Part Sections
  const csiSections = [
    {
      part: 'PART 1 - GENERAL',
      items: [
        {
          num: '1.1 SECTION INCLUDES',
          text: `A. Spray-applied inorganic glass fiber insulation for thermal resistance (R-${specData.rValue}) and sound absorption (NRC ${specData.nrc}) on designated substrates.\nB. Surface preparation, adhesive bonding agents, and required field quality verification.`,
        },
        {
          num: '1.2 RELATED SECTIONS',
          text: 'A. Section 03 30 00 - Cast-in-Place Concrete.\nB. Section 05 30 00 - Metal Decking.\nC. Section 07 81 00 - Applied Fireproofing.\nD. Section 09 20 00 - Plaster and Gypsum Board.',
        },
        {
          num: '1.3 REFERENCES & STANDARDS',
          text: 'A. ASTM C518 - Test Method for Steady-State Thermal Transmission Properties (R-4.00/inch).\nB. ASTM E84 / UL 723 - Surface Burning Characteristics (Flame Spread: 0, Smoke: 0, Class 1/A).\nC. ASTM E136 - Non-Combustibility in Vertical Tube Furnace (Passes 100%).\nD. ASTM C423 - Sound Absorption and Sound Absorption Coefficients by Reverberation Room.\nE. ASTM E736 - Cohesion/Adhesion of Sprayed Fire-Resistive Materials to Substrates (>200 psf).\nF. ASTM E859 - Air Erosion of Sprayed Materials (0.000 g/ft² at 10,000 FPM).\nG. ASTM C1338 - Resistance to Fungi / Zero Mold Growth.',
        },
        {
          num: '1.4 SUBMITTALS',
          text: 'A. Product Data: Manufacturer specifications, ASTM certified lab test reports, and application instructions.\nB. Applicator Certification: Verification that spraying contractor is factory-licensed by Monoglass Inc.\nC. Field Samples: Prepare minimum 100 sq ft mock-up on site showing specified thickness, texture, and density for Architect review.',
        },
        {
          num: '1.5 QUALITY ASSURANCE',
          text: 'A. Manufacturer Qualifications: Monoglass Incorporated with minimum 40 years continuous production.\nB. Applicator Qualifications: Certified and trained by manufacturer with dedicated pneumatic spray equipment.',
        },
        {
          num: '1.6 PROJECT CONDITIONS',
          text: 'A. Maintain ambient and substrate temperature at minimum 40°F (4.4°C) prior to, during, and 72 hours after application.\nB. Provide adequate continuous natural or mechanical ventilation to achieve full adhesive cure within 72-96 hours.',
        },
      ],
    },
    {
      part: 'PART 2 - PRODUCTS',
      items: [
        {
          num: '2.1 ACCEPTABLE MANUFACTURER',
          text: 'A. Monoglass Incorporated, 922-1200 West 73rd Ave, Vancouver, BC V6P 6G5 Canada / Seattle WA USA. Phone: 1-888-766-6645. Web: https://monoglassinsulation.com.\nB. Substitutions: Requests for equals must be submitted minimum 10 days prior to bid closing accompanied by certified zero flame/smoke ASTM E84 test reports.',
        },
        {
          num: '2.2 MATERIALS',
          text: `A. Insulation: Monoglass® pure inorganic, white glass fiber containing minimum 37% recycled glass.\nB. Adhesive: Monoglass concentrated water-soluble polyvinyl acetate resin diluted with clean potable water.\nC. Adhesive Bonding Agent: Mono-Bind primer for smooth steel, painted surfaces, and dense concrete.\nD. Thickness: Spray applied to nominal thickness of ${specData.thicknessInches.toFixed(1)} inches (R-${specData.rValue}, NRC ${specData.nrc}).`,
        },
      ],
    },
    {
      part: 'PART 3 - EXECUTION',
      items: [
        {
          num: '3.1 EXAMINATION & SURFACE PREPARATION',
          text: 'A. Inspect substrates to receive spray insulation. Surfaces must be structurally sound, dry, clean, and free of oil, loose scale, rust, efflorescence, or unapproved curing compounds.\nB. Apply Mono-Bind primer to bare metal or dense concrete substrates per manufacturer guidelines prior to fiber application.',
        },
        {
          num: '3.2 APPLICATION',
          text: `A. Spray apply Monoglass using manufacturer-approved pneumatic equipment with internal adhesive injection.\nB. Apply up to 5 inches (127 mm) in a single uninterrupted pass without sagging or delamination.\nC. Surface Texture: Finish surface as ${specData.finishType.toUpperCase()} texture.`,
        },
        {
          num: '3.3 FIELD QUALITY CONTROL',
          text: `${specData.requireBondTesting ? 'A. Perform ASTM E736 cohesion/adhesion pull testing at minimum 1 test per 5,000 sq ft. Results must exceed 200 psf.\n' : ''}${specData.requireFieldDensityTesting ? 'B. Verify in-place cured density of 3.0 to 4.0 lbs/cu ft per ASTM C303.' : 'B. Verify installed thickness using steel depth pin gauge.'}`,
        },
        {
          num: '3.4 PROTECTION & CLEANING',
          text: 'A. Protect adjacent glass, finished millwork, electrical conduits, and mechanical fixtures with polyethylene masking.\nB. Remove overspray immediately while wet using clean water.',
        },
      ],
    },
  ];

  csiSections.forEach((section) => {
    // Check if section heading fits
    if (currentY > 240) {
      doc.addPage();
      currentY = 24;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.secondary);
    doc.text(section.part, 14, currentY);
    currentY += 4;

    section.items.forEach((item) => {
      if (currentY > 245) {
        doc.addPage();
        currentY = 24;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.primary);
      doc.text(item.num, 14, currentY);
      currentY += 3.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(...COLORS.darkSlate);

      const splitText = doc.splitTextToSize(item.text, pageWidth - 28);
      
      // If split text overflows, manage page break
      if (currentY + splitText.length * 3.2 > 260) {
        doc.addPage();
        currentY = 24;
      }

      doc.text(splitText, 18, currentY);
      currentY += splitText.length * 3.2 + 3;
    });

    currentY += 2;
  });

  addDocumentDecorations(doc, 'CSI 3-Part Specification', `CSI SECTION ${specData.sectionCode}`, qrDataUrl, currentUrl, watermark);

  doc.save(`Monoglass_CSI_${specData.sectionCode.replace(/\s+/g, '')}_${specData.projectName.replace(/\s+/g, '_').substring(0, 20)}.pdf`);
}

/**
 * 3. Export R-Value & Acoustic Calculation Report Submittal
 */
export async function exportCalculatorReportPdf(
  calcData: CalculatorExportData,
  currentUrl: string = 'https://monoglassinsulation.com',
  watermark: string | null = 'PROJECT ESTIMATE'
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const qrDataUrl = await getQrCodeDataUrl();

  // Document Header
  doc.setFillColor(...COLORS.primary);
  doc.rect(14, 14, pageWidth - 28 - (qrDataUrl ? 26 : 0), 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('MONOGLASS® THERMAL & ACOUSTIC CALCULATION SUBMITTAL', 18, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(186, 230, 253);
  doc.text('ENGINEERING ESTIMATE, MATERIAL TAKEOFF & CODE COMPLIANCE REPORT', 18, 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `PROJECT: ${(calcData.projectName || 'COMMERCIAL BUILDING').toUpperCase()} | AREA: ${calcData.squareFootage.toLocaleString()} SQ FT`,
    18,
    34
  );

  let currentY = 44;

  // Key Results KPI Cards
  const colWidth = (pageWidth - 28 - 6) / 3;
  
  // Card 1: Thermal Resistance
  doc.setFillColor(240, 253, 250); // Teal 50
  doc.setDrawColor(...COLORS.accent);
  doc.rect(14, currentY, colWidth, 24, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.accent);
  doc.text('THERMAL RESISTANCE', 18, currentY + 5);
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text(`R-${calcData.rValue.toFixed(1)}`, 18, currentY + 13);
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(`k = 0.250 BTU·in/hr·ft²·°F @ ${calcData.thicknessInches}"`, 18, currentY + 19);

  // Card 2: Acoustic Absorption
  doc.setFillColor(240, 249, 255); // Sky 50
  doc.setDrawColor(...COLORS.secondary);
  doc.rect(14 + colWidth + 3, currentY, colWidth, 24, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.secondary);
  doc.text('ACOUSTIC ABSORPTION', 18 + colWidth + 3, currentY + 5);
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text(`NRC ${calcData.nrc.toFixed(2)}`, 18 + colWidth + 3, currentY + 13);
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('ASTM C423 Reverberation Control', 18 + colWidth + 3, currentY + 19);

  // Card 3: Material Takeoff
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...COLORS.borderGray);
  doc.rect(14 + (colWidth + 3) * 2, currentY, colWidth, 24, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.darkSlate);
  doc.text('MATERIAL ESTIMATE', 18 + (colWidth + 3) * 2, currentY + 5);
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.primary);
  doc.text(`${calcData.bagsNeeded.toLocaleString()} Bags`, 18 + (colWidth + 3) * 2, currentY + 13);
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(`+ ${calcData.adhesivePailsNeeded} Adhesive Pails`, 18 + (colWidth + 3) * 2, currentY + 19);

  currentY += 30;

  // Calculation Breakdown Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  doc.text('PROJECT ESTIMATE SPECIFICATIONS & TAKEOFF DETAILS', 14, currentY);
  currentY += 3;

  const takeoffData = [
    ['Specified Surface Area', `${calcData.squareFootage.toLocaleString()} sq ft`],
    ['Target Insulation Thickness', `${calcData.thicknessInches.toFixed(1)} inches (${(calcData.thicknessInches * 25.4).toFixed(0)} mm)`],
    ['Target Substrate Type', calcData.substrate],
    ['Surface Texture / Finish', calcData.finishType],
    ['Total Thermal Resistance (R-Value)', `R-${calcData.rValue.toFixed(1)} (ASTM C518)`],
    ['Noise Reduction Coefficient (NRC)', `NRC ${calcData.nrc.toFixed(2)} (ASTM C423)`],
    ['Flame Spread & Smoke Developed', '0 / 0 (ASTM E84 Class 1/A Non-Combustible)'],
    ['Monoglass Fiber Bags Required', `${calcData.bagsNeeded.toLocaleString()} bags (30 lb / 13.6 kg bags)`],
    ['Monoglass Adhesive Pails Required', `${calcData.adhesivePailsNeeded.toLocaleString()} pails (5 US Gal / 19 L pails)`],
    ['Estimated Spray Installation Time', `~${calcData.estimatedLaborDays} working days (2-person certified crew)`],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Engineering Metric', 'Calculated Project Specification']],
    body: takeoffData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: COLORS.textDark,
      cellPadding: 2.2,
    },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 'auto', fontStyle: 'bold', textColor: COLORS.primary },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Review & Approval Block
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...COLORS.borderGray);
  doc.rect(14, currentY, pageWidth - 28, 38, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.primary);
  doc.text('ENGINEERING VERIFICATION & BID APPROVAL', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Prepared For: __________________________________________________   Date: ________________________', 18, currentY + 13);
  doc.text('Contractor License #: __________________________________________   Bid Reference: _______________', 18, currentY + 19);
  doc.text('Estimator Signature: ___________________________________________   Status: [ ] Preliminary [ ] Final Bid', 18, currentY + 27);

  addDocumentDecorations(doc, 'Calculation Submittal', 'CALCULATION REPORT', qrDataUrl, currentUrl, watermark);

  doc.save(`Monoglass_Calculation_Report_${calcData.squareFootage}sqft.pdf`);
}

/**
 * 4. Export Material Comparison Matrix PDF
 */
export async function exportComparisonPdf(
  currentUrl: string = 'https://monoglassinsulation.com',
  watermark: string | null = 'DRAFT - FOR REFERENCE ONLY'
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape', // Landscape for wide comparison matrix
    unit: 'mm',
    format: 'letter', // 279.4 x 215.9 mm
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const qrDataUrl = await getQrCodeDataUrl();

  // Document Header Banner
  doc.setFillColor(...COLORS.primary);
  doc.rect(14, 14, pageWidth - 28 - (qrDataUrl ? 26 : 0), 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('MONOGLASS® VS COMPETITIVE INSULATION MATERIALS COMPARISON', 18, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(186, 230, 253);
  doc.text('ARCHITECTURAL BENCHMARK: THERMAL, FIRE SAFETY, ACOUSTICS & ENVIRONMENTAL LIFE-CYCLE', 18, 28);

  const currentY = 40;

  const comparisonTableData = [
    [
      'Thermal Resistance (R-Value/in)',
      'R-4.00 / inch (k = 0.250)',
      'R-3.50 - 3.80 / inch',
      'R-3.70 - 3.80 / inch',
      'R-6.00 - 6.80 / inch',
    ],
    [
      'Flame Spread Index (ASTM E84)',
      '0 (Zero Flame Spread)',
      '0 (Zero Flame Spread)',
      '5 to 15 (Treated paper)',
      '20 to 25 (Requires ignition barrier)',
    ],
    [
      'Smoke Developed Index (ASTM E84)',
      '0 (Zero Smoke Developed)',
      '0 (Zero Smoke Developed)',
      '5 to 20 (Smolders)',
      '350 to 450 (High toxic smoke risk)',
    ],
    [
      'Combustibility (ASTM E136)',
      'Passes - 100% Non-Combustible',
      'Passes - Non-Combustible',
      'Combustible (Organic newspaper)',
      'Combustible (Plastic polymer)',
    ],
    [
      'Acoustical NRC (ASTM C423)',
      'NRC 0.75 - 1.00 (Outstanding)',
      'NRC 0.85 - 1.00',
      'NRC 0.70 - 0.80',
      'NRC 0.15 (Reflective/Poor)',
    ],
    [
      'Air Erosion Resistance (ASTM E859)',
      '0.000 g/ft² @ 10,000+ FPM (114 mph)',
      'Moderate (Sheds under high air)',
      'Moderate to Low (Abrasion shed)',
      'Solid rigid foam matrix',
    ],
    [
      'Fungi & Mold Resistance (ASTM C1338)',
      'Zero Growth (Inorganic Glass)',
      'Inorganic Rock Fibers',
      'Prone if borate salts leach in damp',
      'Resistant (Plastic foam)',
    ],
    [
      'Max Single-Pass Thickness',
      '5.0 inches (127 mm) in one pass',
      '2.0 - 3.0 inches (Layering needed)',
      '1.5 - 2.5 inches max',
      '1.5 - 2.0 inches per lift (Exotherm)',
    ],
    [
      'Recycled Content / Sustainability',
      '37%+ Post-Consumer Recycled Glass',
      '20 - 30% Slag Stone',
      '80% Recycled Newspaper',
      '0% (Petrochemical Polyol/MDI)',
    ],
    [
      'Thermal Barrier Mandate (IBC 2603)',
      'None Required (Exposed OK)',
      'None Required (Exposed OK)',
      'None Required',
      'STRICT CODE MANDATE: 15-min barrier',
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [[
      'Architectural Criterion',
      'Monoglass® Spray Glass Fiber',
      'Mineral / Rock Wool Spray',
      'Cellulose Spray Insulation',
      'Closed-Cell Spray Polyurethane Foam',
    ]],
    body: comparisonTableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: COLORS.textDark,
      cellPadding: 2.2,
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 52, fontStyle: 'bold', textColor: COLORS.primary, fillColor: [240, 249, 255] },
      2: { cellWidth: 46 },
      3: { cellWidth: 46 },
      4: { cellWidth: 48 },
    },
    margin: { left: 14, right: 14 },
  });

  addDocumentDecorations(doc, 'Material Comparison Report', 'MATERIAL COMPARISON', qrDataUrl, currentUrl, watermark);

  doc.save(`Monoglass_Material_Comparison_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Captures the current active View in Print Preview mode using html2canvas & jsPDF,
 * preserving full CSS print-formatting and triggering a direct high-resolution PDF download.
 */
export async function captureAndDownloadViewPdf(options?: {
  elementSelector?: string;
  filename?: string;
  docTitle?: string;
  watermark?: string | null;
}): Promise<boolean> {
  const selector = options?.elementSelector || '.print-preview-sheet';
  const targetElement = document.querySelector(selector) as HTMLElement;

  if (!targetElement) {
    throw new Error(`Target print element "${selector}" not found in DOM`);
  }

  const baseTitle = options?.docTitle || 'Monoglass_Submittal';
  const dateStamp = new Date().toISOString().split('T')[0];
  const safeFilename = options?.filename || `${baseTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_${dateStamp}.pdf`;

  // Capture the rendered DOM element using html2canvas with retina scale & print background
  const canvas = await html2canvas(targetElement, {
    scale: 2, // High resolution (retina 300 DPI equivalent)
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: 1024,
    ignoreElements: (element) => {
      // Ignore interactive controls with no-print class or toolbar
      return (
        element.classList.contains('no-print') &&
        element.id !== 'print-qr-footer'
      );
    },
    onclone: (clonedDoc) => {
      // Ensure cloned print sheet has clean white borders and crisp background
      const sheet = clonedDoc.querySelector(selector) as HTMLElement;
      if (sheet) {
        sheet.style.boxShadow = 'none';
        sheet.style.borderRadius = '0px';
        sheet.style.margin = '0 auto';
        sheet.style.backgroundColor = '#ffffff';
        sheet.style.color = '#0f172a';
      }
    },
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.98);

  // Initialize jsPDF with standard Letter paper (215.9 x 279.4 mm)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
    compress: true,
  });

  const pageWidth = 215.9; // mm
  const pageHeight = 279.4; // mm
  const marginX = 8; // mm margin left & right
  const marginTop = 10; // mm top margin
  const marginBottom = 10; // mm bottom margin

  const printableWidth = pageWidth - marginX * 2;
  const printableHeight = pageHeight - marginTop - marginBottom;

  // Calculate scaled height based on canvas aspect ratio
  const imgWidth = printableWidth;
  const imgHeight = (canvas.height * printableWidth) / canvas.width;

  let heightLeft = imgHeight;
  let currentY = marginTop;

  // First Page
  pdf.addImage(imgData, 'JPEG', marginX, currentY, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= printableHeight;

  // Add subsequent pages if content exceeds single page height
  while (heightLeft > 0) {
    currentY = marginTop - (imgHeight - heightLeft);
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', marginX, currentY, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= printableHeight;
  }

  // Apply watermark to all pages if requested
  if (options?.watermark && options.watermark !== 'NONE') {
    const pageCount = (pdf as any).internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      pdf.setPage(p);
      addWatermarkToPage(pdf, options.watermark);
    }
  }

  // Trigger direct browser file download
  pdf.save(safeFilename);
  return true;
}

export interface MultiRoomEstimatorExportData {
  project: {
    name: string;
    projectType: string;
    location?: string;
    clientOrArchitect?: string;
    unitSystem: 'imperial' | 'metric';
    notes?: string;
  };
  bom: {
    totalPlanAreaSqFt: number;
    totalPlanAreaSqM: number;
    totalEffectiveAreaSqFt: number;
    totalEffectiveAreaSqM: number;
    totalBagsFiber: number;
    totalFiberWeightLbs: number;
    totalFiberWeightKg: number;
    totalAdhesiveConcentrateGallons: number;
    totalAdhesiveConcentrateLiters: number;
    totalAdhesivePails: number;
    totalWaterGallons: number;
    totalSonoglazeGallons: number;
    totalSonoglazePails: number;
    blendedRValue: number;
    blendedRsi: number;
    blendedNrc: number;
    totalDeadLoadLbs: number;
    totalDeadLoadTonnes: number;
    totalSprayHours: number;
    totalRigDays: number;
    roomBreakdowns: {
      room: {
        name: string;
        substrateType: string;
        planArea: number;
        finishType: string;
        wastagePercent: number;
        ceilingHeightFt?: number;
      };
      effectiveAreaSqFt: number;
      effectiveAreaSqM: number;
      thicknessInches: number;
      thicknessMm: number;
      rValue: number;
      rsi: number;
      nrc: number;
      bags: number;
      adhesiveGallons: number;
      sonoglazeGallons: number;
      deadLoadLbs: number;
      sprayHours: number;
    }[];
  };
}

/**
 * Generates and downloads a multi-page architectural PDF for a Consolidated Multi-Room Project Estimate
 */
export async function exportMultiRoomEstimatorPdf(
  data: MultiRoomEstimatorExportData,
  options?: { watermark?: string | null; filename?: string }
): Promise<boolean> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
    compress: true,
  });

  const pageWidth = 215.9;
  const pageHeight = 279.4;
  const isMetric = data.project.unitSystem === 'metric';

  // Helper for Header
  const renderHeader = (pageNum: number) => {
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 20, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('MONOGLASS® SPRAY-APPLIED GLASS FIBER INSULATION', 14, 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(186, 230, 253);
    doc.text('CONSOLIDATED MULTI-ROOM PROJECT ESTIMATE & BILL OF MATERIALS', 14, 15);

    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`Page ${pageNum}`, pageWidth - 24, 12);
  };

  const renderFooter = (pageNum: number, totalPages: number) => {
    doc.setDrawColor(...COLORS.borderGray);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(
      'Monoglass Insulation Inc. • ASTM E84 (0/0) • ASTM E136 Non-Combustible • monoglassinsulation.com',
      14,
      pageHeight - 7
    );

    doc.text(
      `Generated ${new Date().toLocaleDateString()} • Project: ${data.project.name}`,
      pageWidth - 85,
      pageHeight - 7
    );
  };

  // PAGE 1: Executive Summary & Consolidated BOM
  renderHeader(1);
  let currentY = 27;

  // Project Info Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text((data.project.name || 'MULTI-ROOM PROJECT ESTIMATE').toUpperCase(), 14, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  const metaText = `Project Type: ${data.project.projectType}  |  Date: ${new Date().toLocaleDateString()}  |  Unit System: ${
    isMetric ? 'Metric (SI)' : 'Imperial (US)'
  } ${data.project.location ? ` | Location: ${data.project.location}` : ''}`;
  doc.text(metaText, 14, currentY);
  currentY += 7;

  // Key KPI Cards Grid (4 Cards)
  const cardW = (pageWidth - 28 - 9) / 4;

  // KPI 1: Total Surface Area
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(...COLORS.secondary);
  doc.rect(14, currentY, cardW, 20, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.secondary);
  doc.text('TOTAL SURFACE AREA', 17, currentY + 5);
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  doc.text(
    isMetric
      ? `${data.bom.totalEffectiveAreaSqM.toLocaleString()} m²`
      : `${data.bom.totalEffectiveAreaSqFt.toLocaleString()} sq ft`,
    17,
    currentY + 11
  );
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(
    isMetric
      ? `Plan: ${data.bom.totalPlanAreaSqM.toLocaleString()} m²`
      : `Plan: ${data.bom.totalPlanAreaSqFt.toLocaleString()} sq ft`,
    17,
    currentY + 16
  );

  // KPI 2: Blended R-Value
  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(...COLORS.accent);
  doc.rect(14 + cardW + 3, currentY, cardW, 20, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.accent);
  doc.text('BLENDED R-VALUE', 17 + cardW + 3, currentY + 5);
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  doc.text(
    isMetric ? `RSI ${data.bom.blendedRsi.toFixed(2)}` : `R-${data.bom.blendedRValue.toFixed(1)}`,
    17 + cardW + 3,
    currentY + 11
  );
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(
    isMetric ? `R-${data.bom.blendedRValue.toFixed(1)} equiv.` : `RSI ${data.bom.blendedRsi.toFixed(2)}`,
    17 + cardW + 3,
    currentY + 16
  );

  // KPI 3: Total Fiber Bags
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...COLORS.borderGray);
  doc.rect(14 + (cardW + 3) * 2, currentY, cardW, 20, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.darkSlate);
  doc.text('MONOGLASS FIBER', 17 + (cardW + 3) * 2, currentY + 5);
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  doc.text(`${data.bom.totalBagsFiber.toLocaleString()} Bags`, 17 + (cardW + 3) * 2, currentY + 11);
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(
    isMetric
      ? `${(data.bom.totalFiberWeightKg / 1000).toFixed(1)} metric tonnes`
      : `${data.bom.totalFiberWeightLbs.toLocaleString()} lbs dry`,
    17 + (cardW + 3) * 2,
    currentY + 16
  );

  // KPI 4: Labor Logistics
  doc.setFillColor(254, 252, 232);
  doc.setDrawColor(202, 138, 4);
  doc.rect(14 + (cardW + 3) * 3, currentY, cardW, 20, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(161, 98, 7);
  doc.text('RIG ESTIMATE', 17 + (cardW + 3) * 3, currentY + 5);
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  doc.text(`~${data.bom.totalRigDays} Rig Days`, 17 + (cardW + 3) * 3, currentY + 11);
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(`${data.bom.totalSprayHours} Spray Hours`, 17 + (cardW + 3) * 3, currentY + 16);

  currentY += 25;

  // CONSOLIDATED BILL OF MATERIALS TABLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.primary);
  doc.text('CONSOLIDATED BILL OF MATERIALS (BOM)', 14, currentY);
  currentY += 2.5;

  const bomRows = [
    [
      'Monoglass Virgin White Glass Fiber (30 lb / 13.6 kg bags)',
      `${data.bom.totalBagsFiber.toLocaleString()} Bags`,
      isMetric
        ? `${data.bom.totalFiberWeightKg.toLocaleString()} kg (${(data.bom.totalFiberWeightKg / 1000).toFixed(2)} tonnes)`
        : `${data.bom.totalFiberWeightLbs.toLocaleString()} lbs dry fiber`,
      'Class 1 / Class A Non-Combustible (ASTM E84 0/0, ASTM E136)',
    ],
    [
      'Monoglass Adhesive Concentrate (5 US Gal / 18.9 L Pails)',
      `${data.bom.totalAdhesivePails.toLocaleString()} Pails (${data.bom.totalAdhesiveConcentrateGallons} gal)`,
      isMetric
        ? `${data.bom.totalAdhesiveConcentrateLiters.toLocaleString()} Liters`
        : `${data.bom.totalAdhesiveConcentrateGallons.toLocaleString()} Gallons`,
      'Dilute 1:1 with clean potable water at jobsite',
    ],
    [
      'Jobsite Clean Dilution Water Requirement',
      `${data.bom.totalWaterGallons.toLocaleString()} gal`,
      isMetric
        ? `${Math.round(data.bom.totalWaterGallons * 3.78541).toLocaleString()} Liters`
        : `${data.bom.totalWaterGallons.toLocaleString()} Gallons`,
      'Potable water source on jobsite',
    ],
    [
      'Sonoglaze Acrylic Polymer Protective Hard-Coat',
      data.bom.totalSonoglazeGallons > 0
        ? `${data.bom.totalSonoglazePails} Pails (${data.bom.totalSonoglazeGallons} gal)`
        : 'None Specified',
      data.bom.totalSonoglazeGallons > 0
        ? isMetric
          ? `${Math.round(data.bom.totalSonoglazeGallons * 3.78541)} Liters`
          : `${data.bom.totalSonoglazeGallons} Gallons`
        : 'N/A',
      data.bom.totalSonoglazeGallons > 0
        ? 'High-abrasion/washdown zones & fan rooms'
        : 'Standard natural spray finish throughout',
    ],
    [
      'Structural Dead Load Impact',
      isMetric ? `${data.bom.totalDeadLoadTonnes} Tonnes` : `${data.bom.totalDeadLoadLbs.toLocaleString()} lbs`,
      'Installed dry density ~3.2 lbs/cu ft (51.3 kg/m³)',
      'Lightweight thermal barrier, minimal structural penalty',
    ],
    [
      'Estimated Certified Spray Crew Logistics',
      `~${data.bom.totalRigDays} Working Rig Days`,
      `~${data.bom.totalSprayHours} Total Machine Hours`,
      'Based on standard 3-person certified spray crew (~1,000 bd ft/hr)',
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Material / Equipment Item', 'Quantity', 'Mass / Volume', 'Specification Notes']],
    body: bomRows,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: COLORS.textDark,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    styles: {
      cellPadding: 1.8,
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // ROOM-BY-ROOM ITEMIZATION TABLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.primary);
  doc.text('ITEMIZED ROOM & AREA TAKEOFF BREAKDOWN', 14, currentY);
  currentY += 2.5;

  const roomTableRows = data.bom.roomBreakdowns.map((line, idx) => {
    return [
      `${idx + 1}. ${line.room.name}`,
      line.room.substrateType.replace('-', ' '),
      isMetric
        ? `${line.room.planArea.toLocaleString()} m²\n(${line.effectiveAreaSqM.toLocaleString()} eff)`
        : `${line.room.planArea.toLocaleString()} sq ft\n(${line.effectiveAreaSqFt.toLocaleString()} eff)`,
      isMetric
        ? `${line.thicknessMm} mm\n(RSI ${line.rsi.toFixed(2)})`
        : `${line.thicknessInches.toFixed(1)}"\n(R-${line.rValue.toFixed(1)})`,
      `NRC ${line.nrc.toFixed(2)}`,
      line.room.finishType,
      `${line.room.wastagePercent}%`,
      `${line.bags.toLocaleString()} bags`,
      line.sonoglazeGallons > 0 ? `${line.sonoglazeGallons} gal` : '—',
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        'Room / Zone Name',
        'Substrate Profile',
        isMetric ? 'Plan Area (Eff)' : 'Plan Area (Eff)',
        isMetric ? 'Thickness (RSI)' : 'Thickness (R-Val)',
        'Acoustics',
        'Finish Type',
        'Waste',
        'Fiber Bags',
        'Sonoglaze',
      ],
    ],
    body: roomTableRows,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.darkSlate,
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: COLORS.textDark,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    styles: {
      cellPadding: 1.6,
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // Notes & Quality Assurance Block
  if (currentY < pageHeight - 32) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.primary);
    doc.text('MANDATORY JOB SITE QUALITY ASSURANCE & SUBSTRATE READINESS:', 14, currentY);
    currentY += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.textDark);
    const qaPoints = [
      '1. Substrate Temperature: Substrates and ambient air must be minimum 40°F (4.5°C) and rising for 24h during and after spray.',
      '2. Substrate Cleanliness: Concrete must be free of form-release oils, curing compounds, efflorescence, and dust. Oily metal decks must be degreased.',
      '3. Bond Strength Verification: Bond strength exceeds 200+ lbs/sq ft per ASTM E736. Zero mechanical clips or pins required under 5.0" (127 mm).',
      '4. Single-Pass Execution: Up to 5.0" (127 mm / R-20) applied in a single monolithic pass. Multi-pass installations require inter-pass cure.',
      '5. Curing Cross-Ventilation: Provide 2 to 4 continuous air changes per hour for 24 to 72 hours post-installation.',
    ];

    qaPoints.forEach((pt) => {
      doc.text(pt, 14, currentY);
      currentY += 3;
    });
  }

  // Watermark Support
  if (options?.watermark && options.watermark !== 'NONE') {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      addWatermarkToPage(doc, options.watermark);
      renderFooter(p, pageCount);
    }
  } else {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      renderFooter(p, pageCount);
    }
  }

  const safeName = (data.project.name || 'Monoglass_Project_Takeoff').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${safeName}_Consolidated_BOM.pdf`);
  return true;
}

/**
 * Exports a Single Project Case Study Profile as an Architectural PDF
 */
export async function exportCaseStudyPdf(
  cs: CaseStudy,
  options?: { watermark?: string | null; filename?: string }
): Promise<boolean> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const renderHeader = (docInstance: jsPDF) => {
    docInstance.setFillColor(...COLORS.primary);
    docInstance.rect(0, 0, pageWidth, 24, 'F');

    docInstance.setFont('helvetica', 'bold');
    docInstance.setFontSize(14);
    docInstance.setTextColor(255, 255, 255);
    docInstance.text('MONOGLASS® ENGINEERING CASE STUDY', 14, 11);

    docInstance.setFont('helvetica', 'normal');
    docInstance.setFontSize(8);
    docInstance.setTextColor(186, 230, 253);
    docInstance.text(
      'SPRAY-APPLIED THERMAL & ACOUSTICAL GLASS FIBER INSULATION • CSI 07 21 29 / 09 81 00',
      14,
      17
    );

    docInstance.setFont('helvetica', 'bold');
    docInstance.setFontSize(8);
    docInstance.setTextColor(255, 255, 255);
    docInstance.text(
      `PROJECT REF: ${cs.id.toUpperCase()} • ${cs.category.toUpperCase()}`,
      pageWidth - 14,
      14,
      { align: 'right' }
    );
  };

  const renderFooter = (pageNum: number, totalPages: number) => {
    doc.setDrawColor(...COLORS.borderGray);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(
      'Monoglass Incorporated • Field Technical Support: 1-888-766-6645 • info@monoglass.com • www.monoglass.com',
      14,
      pageHeight - 7
    );
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  };

  renderHeader(doc);

  let currentY = 30;

  // Project Header Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.textDark);
  const titleLines = doc.splitTextToSize(cs.title, pageWidth - 28);
  doc.text(titleLines, 14, currentY);
  currentY += titleLines.length * 5 + 1;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.secondary);
  doc.text(
    `LOCATION: ${cs.location.toUpperCase()}   •   FACILITY TYPE: ${cs.facilityType.toUpperCase()}`,
    14,
    currentY
  );
  currentY += 6;

  // Key Spec Metric Cards (4 Grid Boxes)
  const cardWidth = (pageWidth - 28 - 9) / 4;
  const metrics = [
    { label: 'THICKNESS & R-VALUE', val: `${cs.thicknessApplied}`, sub: cs.rValueAchieved },
    { label: 'ACOUSTIC NRC', val: `${cs.nrcAchieved}`, sub: 'Sound Absorption' },
    { label: 'TOTAL SURFACE AREA', val: `${cs.squareFootage.toLocaleString()} SQ FT`, sub: cs.substrate },
    { label: 'FINISH SPECIFICATION', val: `${cs.finishType}`, sub: `CSI ${cs.csiSection || '07 21 29'}` },
  ];

  metrics.forEach((m, idx) => {
    const cardX = 14 + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(...COLORS.borderGray);
    doc.roundedRect(cardX, currentY, cardWidth, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(m.label, cardX + 3, currentY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.textDark);
    const valLines = doc.splitTextToSize(m.val, cardWidth - 6);
    doc.text(valLines, cardX + 3, currentY + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.secondary);
    doc.text(m.sub, cardX + 3, currentY + 17);
  });

  currentY += 24;

  // Challenge Box
  doc.setFillColor(254, 243, 199); // Amber 100
  doc.setDrawColor(251, 191, 36); // Amber 400
  doc.roundedRect(14, currentY, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14); // Amber 900
  doc.text('THE ENGINEERING & ARCHITECTURAL CHALLENGE', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 53, 15);
  const challengeLines = doc.splitTextToSize(cs.challenge, pageWidth - 36);
  doc.text(challengeLines, 18, currentY + 11);

  currentY += 30;

  // Solution Box
  doc.setFillColor(238, 242, 255); // Indigo 50
  doc.setDrawColor(165, 180, 252); // Indigo 300
  doc.roundedRect(14, currentY, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(55, 48, 163); // Indigo 900
  doc.text('THE MONOGLASS® SPRAY-APPLIED SOLUTION', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(67, 56, 202);
  const solutionLines = doc.splitTextToSize(cs.solution, pageWidth - 36);
  doc.text(solutionLines, 18, currentY + 11);

  currentY += 30;

  // Documented Verified Results Box
  doc.setFillColor(240, 253, 244); // Emerald 50
  doc.setDrawColor(110, 231, 183); // Emerald 300
  const resultsBoxHeight = 10 + cs.results.length * 6;
  doc.roundedRect(14, currentY, pageWidth - 28, resultsBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(6, 95, 70); // Emerald 800
  doc.text('DOCUMENTED FIELD RESULTS & COMPLIANCE VERIFICATION', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(4, 120, 87);
  let resY = currentY + 11;
  cs.results.forEach((res) => {
    doc.text(`•  ${res}`, 18, resY);
    resY += 5.5;
  });

  currentY += resultsBoxHeight + 5;

  // Material & Testing Standards Matrix
  autoTable(doc, {
    startY: currentY,
    head: [['TEST STANDARD', 'PROPERTY / METHOD', 'SPECIFIED PERFORMANCE', 'FIELD RESULT']],
    body: [
      ['ASTM E84 / UL 723', 'Surface Burning Characteristics', 'Flame Spread = 0, Smoke Developed = 0', 'Class A Non-Combustible Compliant'],
      ['ASTM C518', 'Thermal Transmission Resistance', 'R-4.00 per inch continuous', cs.rValueAchieved],
      ['ASTM C423', 'Sound Absorption Coefficients', 'NRC 0.90 to 1.00 Type A mounting', cs.nrcAchieved],
      ['ASTM E736', 'Adhesive Cohesive Bond Strength', '> 200 lbs/sq ft direct to substrate', 'Exceeds standard with zero pins'],
      ['ASTM E859', 'Air Erosion Resistance', '0.000 g/ft² air stream loss @ 800 ft/min', 'Zero fiber erosion in HVAC air streams'],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.darkSlate,
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: COLORS.textDark,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 38 },
      1: { cellWidth: 50 },
      2: { cellWidth: 50 },
      3: { fontStyle: 'bold', textColor: COLORS.secondary, cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  });

  // Watermark Support
  if (options?.watermark && options.watermark !== 'NONE') {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      addWatermarkToPage(doc, options.watermark);
      renderFooter(p, pageCount);
    }
  } else {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      renderFooter(p, pageCount);
    }
  }

  const safeTitle = (cs.title || 'Case_Study').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 35);
  doc.save(`Monoglass_CaseStudy_${cs.id}_${safeTitle}.pdf`);
  return true;
}

/**
 * Exports a formal Monoglass Project Schedule & Trade Coordination Report PDF
 */
export async function exportSchedulePdf(
  input: ScheduleInput,
  res: ScheduleEstimateResult,
  options?: { watermark?: WatermarkPreset | string }
): Promise<boolean> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const primaryColor: [number, number, number] = COLORS.primary;
  const secondaryColor: [number, number, number] = COLORS.secondary;
  const qrDataUrl = await getQrCodeDataUrl();

  const renderHeader = (pageNumber: number) => {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 18, 'F');

    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.rect(0, 18, pageWidth, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('MONOGLASS® SPRAY-APPLIED INSULATION', 14, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text('PROJECT SCHEDULE & TRADE COORDINATION REPORT', pageWidth - 14, 11, { align: 'right' });
  };

  const renderFooter = (pageNumber: number, totalPages: number) => {
    doc.setDrawColor(COLORS.borderGray[0], COLORS.borderGray[1], COLORS.borderGray[2]);
    doc.setLineWidth(0.5);
    doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
    doc.text('CSI 07 21 29 / 09 81 00 • Monoglass Schedule Estimator', 14, pageHeight - 10);
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 14, pageHeight - 10, { align: 'right' });

    if (qrDataUrl) {
      try {
        doc.addImage(qrDataUrl, 'PNG', pageWidth - 32, pageHeight - 28, 12, 12);
      } catch {
        // ignore
      }
    }
  };

  renderHeader(1);

  let y = 26;

  // Title & Project Header Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(input.projectName || 'Monoglass Project Schedule Estimate', 14, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Generated: ${dateStr} • Application: Monoglass® Spray-Applied Glass Fiber Insulation`, 14, y);
  y += 7;

  // KPI Summary Metric Boxes (4-box layout)
  const boxWidth = (pageWidth - 28 - 9) / 4;
  const boxHeight = 16;
  const kpis = [
    { label: 'CALENDAR DAYS', val: `${res.totalCalendarDays} Days`, sub: `Through ${res.calculatedEndDate}` },
    { label: 'ACTIVE WORK DAYS', val: `${res.totalWorkingDays} Days`, sub: `${res.totalSprayDays} Spray Days` },
    { label: 'CREW MAN-HOURS', val: `${res.totalCrewManHours} Hrs`, sub: `${input.crewCount} Crew(s) (${input.shiftType})` },
    { label: 'TRADE RE-ENTRY', val: `Day ${res.subsequentTradeReEntryDay}`, sub: `Clearance: ${res.tradeReEntryDate}` },
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (boxWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(COLORS.borderGray[0], COLORS.borderGray[1], COLORS.borderGray[2]);
    doc.roundedRect(x, y, boxWidth, boxHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
    doc.text(kpi.label, x + 3, y + 4.5);

    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(kpi.val, x + 3, y + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(kpi.sub, x + 3, y + 14.5);
  });

  y += boxHeight + 6;

  // Project Parameters Summary Table
  const isMetric = input.unitSystem === 'metric';
  const areaFormatted = isMetric
    ? `${Math.round(input.targetArea).toLocaleString()} sq m (${Math.round(res.effectiveAreaSqFt).toLocaleString()} sq ft eff.)`
    : `${Math.round(input.targetArea).toLocaleString()} sq ft (${Math.round(res.effectiveAreaSqFt).toLocaleString()} sq ft eff.)`;
  
  const thickFormatted = isMetric
    ? `${Math.round(input.targetThicknessInches)} mm (R-${(input.targetThicknessInches / 25.4 * 4.0).toFixed(1)})`
    : `${input.targetThicknessInches.toFixed(1)}" (R-${(input.targetThicknessInches * 4.0).toFixed(1)})`;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [['Project Parameter', 'Specification', 'Site Factor', 'Impact on Schedule']],
    body: [
      ['Scope Area & Thickness', `${areaFormatted} @ ${thickFormatted}`, `Substrate: ${input.substrateType}`, `${res.boardFeetTotal.toLocaleString()} Board-Feet`],
      ['Ceiling Height & Access', `${input.ceilingHeightFt} ft (${input.accessEquipment})`, `MEP Density: ${input.mepDensity}`, `Speed Factor: ${Math.round(res.dailyProductionBoardFt)} bd-ft/day`],
      ['Masking & Primer Scope', `Masking: ${input.maskingLevel}`, `Primer: ${input.primerRequired ? 'K-Lastic Required' : 'None / Clean'}`, `Prep: ${res.totalPrepDays} working day(s)`],
      ['Finish & Material Volume', `Finish: ${input.finishType}`, `Est. Material: ${res.estimatedBags.toLocaleString()} Bags`, `Truckloads: ~${res.estimatedTruckloads} Semi-Trailer(s)`],
    ],
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: COLORS.textDark,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 42 },
      1: { cellWidth: 50 },
      2: { cellWidth: 45 },
      3: { fontStyle: 'bold', textColor: secondaryColor, cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Phased Schedule Breakdown Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('PHASED INSTALLATION TIMELINE & MILESTONES', 14, y);
  y += 4;

  const phaseRows = res.phases.map((p) => [
    p.name,
    `Day ${p.startDay} – Day ${p.endDay}`,
    `${p.durationDays} Day${p.durationDays > 1 ? 's' : ''}`,
    `${p.crewManHours} Hrs`,
    p.description,
  ]);

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    head: [['Phase Name', 'Timeline Window', 'Duration', 'Crew Hours', 'Phase Scope & Key Deliverables']],
    body: phaseRows,
    headStyles: {
      fillColor: secondaryColor,
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: COLORS.textDark,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45 },
      1: { cellWidth: 26 },
      2: { cellWidth: 16 },
      3: { cellWidth: 18 },
      4: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Check if we need page break for Equipment & Critical Path
  if (y > pageHeight - 65) {
    doc.addPage();
    renderHeader(2);
    y = 26;
  }

  // Critical Path & Trade Coordination Guidance
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('CRITICAL PATH & GENERAL CONTRACTOR COORDINATION', 14, y);
  y += 4;

  res.criticalPathNotes.forEach((note) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('•', 16, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
    const splitNote = doc.splitTextToSize(note, pageWidth - 36);
    doc.text(splitNote, 20, y);
    y += splitNote.length * 3.5 + 1;
  });

  y += 2;

  // Environmental & Weather Advisories
  if (res.weatherAdvisories.length > 0) {
    if (y > pageHeight - 45) {
      doc.addPage();
      renderHeader((doc as any).internal.getNumberOfPages());
      y = 26;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
    doc.text('CLIMATE CONDITIONING & CURING REQUIREMENTS', 14, y);
    y += 4;

    res.weatherAdvisories.forEach((adv) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
      const splitAdv = doc.splitTextToSize(adv, pageWidth - 28);
      doc.text(splitAdv, 14, y);
      y += splitAdv.length * 3.5 + 2;
    });
  }

  // Watermark Support
  if (options?.watermark && options.watermark !== 'NONE') {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      addWatermarkToPage(doc, options.watermark);
      renderFooter(p, pageCount);
    }
  } else {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      renderFooter(p, pageCount);
    }
  }

  const safeTitle = (input.projectName || 'Schedule_Estimate').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
  doc.save(`Monoglass_ProjectSchedule_${safeTitle}.pdf`);
  return true;
}

/**
 * Exports a comprehensive Project Cost & Budget Estimation PDF
 */
export async function exportCostEstimatorPdf(
  input: CostEstimatorInput,
  result: CostEstimatorResult,
  options?: {
    watermark?: WatermarkPreset;
    estimateName?: string;
    roomsBreakdown?: Array<{
      id: string;
      name: string;
      area: number;
      thickness: string;
      rValue: string;
      finish: string;
      bags: number;
      adhesivePails: number;
      sonoglazePails: number;
      estimatedCost: number;
      costPerSqFt: number;
    }>;
  }
): Promise<boolean> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const qrDataUrl = await getQrCodeDataUrl();

  const primaryColor = COLORS.primary;
  const secondaryColor = COLORS.secondary;
  const isMetric = input.unitSystem === 'metric';

  const renderHeader = (pageNumber: number) => {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 18, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(255, 255, 255);
    doc.text('MONOGLASS® SPRAY-APPLIED GLASS FIBER INSULATION', 14, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(224, 231, 255);
    doc.text('PROJECT COST ESTIMATE & BUDGET BREAKDOWN', pageWidth - 14, 8, { align: 'right' });
    doc.text('CSI 07 21 29 / 09 81 00 • ASTM E84 (0/0)', pageWidth - 14, 13, { align: 'right' });
  };

  const renderFooter = (pageNumber: number, totalPages: number) => {
    doc.setFillColor(COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]);
    doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
    doc.setDrawColor(COLORS.borderGray[0], COLORS.borderGray[1], COLORS.borderGray[2]);
    doc.line(0, pageHeight - 20, pageWidth, pageHeight - 20);

    if (qrDataUrl) {
      try {
        doc.addImage(qrDataUrl, 'PNG', 12, pageHeight - 18, 14, 14);
      } catch (err) {
        // fallback
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
    doc.text('MONOGLASS INCORPORATED | TECHNICAL SPECIFICATION & ESTIMATING DIVISION', qrDataUrl ? 29 : 14, pageHeight - 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
    doc.text('Toll-Free: 1-888-777-2465 • Email: info@monoglass.com • Web: www.monoglassinsulation.com', qrDataUrl ? 29 : 14, pageHeight - 9);
    doc.text('Estimate generated via Monoglass Project Budget Engine. Material prices and labor rates subject to jobsite verification.', qrDataUrl ? 29 : 14, pageHeight - 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
  };

  // Page 1
  renderHeader(1);
  let y = 25;

  // Title Banner Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(12, y, pageWidth - 24, 22, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, y, pageWidth - 24, 22, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(input.projectName || 'Commercial Monoglass Installation', 16, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
  const budgetTitle = options?.estimateName ? `Budget Version: ${options.estimateName} • ` : '';
  doc.text(`${budgetTitle}Location: ${input.location || 'North America'} • Specifier: ${input.clientOrArchitect || 'Apex Architecture'}`, 16, y + 13.5);
  doc.text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} • Unit System: ${isMetric ? 'Metric' : 'Imperial'}`, 16, y + 18);

  y += 26;

  // 4 KPI Summary Cards
  const cardW = (pageWidth - 24 - 9) / 4;
  const cardH = 18;

  // Card 1: Total Grand Budget
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.roundedRect(12, y, cardW, cardH, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(56, 189, 248); // sky 400
  doc.text('TOTAL PROJECT BUDGET', 15, y + 5);
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(`$${result.grandTotalCost.toLocaleString()}`, 15, y + 12);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`${isMetric ? `$${result.costPerSqM}/m²` : `$${result.costPerSqFt}/sq ft`}`, 15, y + 15.5);

  // Card 2: Materials Total
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12 + cardW + 3, y, cardW, cardH, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(12 + cardW + 3, y, cardW, cardH, 2, 2, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(16, 185, 129); // emerald
  doc.text('MATERIALS TOTAL', 15 + cardW + 3, y + 5);
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`$${result.materialsCost.toLocaleString()}`, 15 + cardW + 3, y + 12);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
  doc.text(`${result.totalBags} Bags • ${result.totalAdhesivePails} Pails`, 15 + cardW + 3, y + 15.5);

  // Card 3: Labor & Spray Crew
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12 + (cardW + 3) * 2, y, cardW, cardH, 2, 2, 'F');
  doc.roundedRect(12 + (cardW + 3) * 2, y, cardW, cardH, 2, 2, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(245, 158, 11); // amber
  doc.text('CREW LABOR COST', 15 + (cardW + 3) * 2, y + 5);
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`$${result.laborCost.toLocaleString()}`, 15 + (cardW + 3) * 2, y + 12);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
  doc.text(`${result.totalCrewManHours} Man-Hrs • $${input.loadedLaborRatePerHour}/hr`, 15 + (cardW + 3) * 2, y + 15.5);

  // Card 4: Equipment & Markups
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12 + (cardW + 3) * 3, y, cardW, cardH, 2, 2, 'F');
  doc.roundedRect(12 + (cardW + 3) * 3, y, cardW, cardH, 2, 2, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(147, 51, 234); // purple
  doc.text('EQUIPMENT & MARKUPS', 15 + (cardW + 3) * 3, y + 5);
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  const markupTotal = result.equipmentCost + result.logisticsCost + result.overheadProfitCost + result.contingencyCost + result.salesTaxCost;
  doc.text(`$${markupTotal.toLocaleString()}`, 15 + (cardW + 3) * 3, y + 12);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
  doc.text(`O&P ${input.overheadProfitPercent}% • Cont. ${input.contingencyPercent}%`, 15 + (cardW + 3) * 3, y + 15.5);

  y += cardH + 6;

  // Key Scope & Engineering Parameters Table
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [['Project Scope Parameter', 'Value / Metric', 'Pricing & Labor Assumptions', 'Applied Rate']],
    body: [
      [
        'Total Plan Area',
        isMetric ? `${result.planAreaSqM.toLocaleString()} m²` : `${result.planAreaSqFt.toLocaleString()} sq ft`,
        'Loaded Labor Rate / Worker',
        `$${input.loadedLaborRatePerHour.toFixed(2)} / hr (${input.crewSize}-man crew)`,
      ],
      [
        'Effective Spray Area',
        isMetric ? `${result.effectiveAreaSqM.toLocaleString()} m² (flutes accounted)` : `${result.effectiveAreaSqFt.toLocaleString()} sq ft (flutes accounted)`,
        'Fiber Bag Unit Price',
        `$${input.fiberBagCost.toFixed(2)} / 30 lb bag (${input.fiberColor})`,
      ],
      [
        'Target Thickness & Thermal',
        `${input.targetThicknessInches.toFixed(1)}" (R-${input.targetRValue.toFixed(1)})`,
        'Adhesive Concentrate Pail',
        `$${input.adhesivePailCost.toFixed(2)} / 5-gal pail`,
      ],
      [
        'Board Feet & Bag Count',
        `${result.boardFeetTotal.toLocaleString()} bd ft • ${result.totalBags.toLocaleString()} bags`,
        'Sonoglaze Protective Hard-Coat',
        input.finishType === 'Sonoglaze Hard-Coat' ? `$${input.sonoglazePailCost.toFixed(2)} / pail (${result.totalSonoglazePails} pails)` : 'Not Required',
      ],
      [
        'Est. Spray Machine Time',
        `${result.estimatedSprayHours} hrs (~${result.estimatedRigDays} rig days)`,
        'Overhead, Profit & Contingency',
        `O&P: ${input.overheadProfitPercent}% | Cont: ${input.contingencyPercent}% | Tax: ${input.salesTaxPercent}%`,
      ],
    ],
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: COLORS.textDark,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45 },
      1: { cellWidth: 45 },
      2: { fontStyle: 'bold', cellWidth: 50 },
      3: { cellWidth: 45 },
    },
    margin: { left: 12, right: 12 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Itemized Cost Schedule Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('ITEMIZED COST TAKEOFF & BID SCHEDULE', 12, y);
  y += 3;

  const itemizedRows = result.lineItems.map((item) => [
    item.category,
    item.name,
    `${item.quantity.toLocaleString()} ${item.unit}`,
    `$${item.unitRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `$${item.totalCost.toLocaleString()}`,
    `${item.percentOfSubtotal}%`,
  ]);

  // Append Markups
  itemizedRows.push(
    [
      'Markup & Fees',
      `Contingency Allowance (${input.contingencyPercent}%)`,
      '1 Lump Sum',
      `$${result.contingencyCost.toLocaleString()}`,
      `$${result.contingencyCost.toLocaleString()}`,
      `${Number(((result.contingencyCost / result.grandTotalCost) * 100).toFixed(1))}%`,
    ],
    [
      'Markup & Fees',
      `Contractor Overhead & Profit (${input.overheadProfitPercent}%)`,
      '1 Lump Sum',
      `$${result.overheadProfitCost.toLocaleString()}`,
      `$${result.overheadProfitCost.toLocaleString()}`,
      `${Number(((result.overheadProfitCost / result.grandTotalCost) * 100).toFixed(1))}%`,
    ],
    [
      'Markup & Fees',
      `Estimated Materials Sales Tax (${input.salesTaxPercent}%)`,
      '1 Lump Sum',
      `$${result.salesTaxCost.toLocaleString()}`,
      `$${result.salesTaxCost.toLocaleString()}`,
      `${Number(((result.salesTaxCost / result.grandTotalCost) * 100).toFixed(1))}%`,
    ]
  );

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    head: [['Category', 'Description / Item Details', 'Quantity & Unit', 'Unit Price', 'Total Cost (USD)', '% Subtotal']],
    body: itemizedRows,
    foot: [
      [
        'GRAND TOTAL',
        `Complete Monoglass Turnkey Installation (${isMetric ? `$${result.costPerSqM}/m²` : `$${result.costPerSqFt}/sq ft`})`,
        `${result.totalBags} Bags`,
        '—',
        `$${result.grandTotalCost.toLocaleString()}`,
        '100.0%',
      ],
    ],
    headStyles: {
      fillColor: secondaryColor,
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: 2.2,
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: COLORS.textDark,
    },
    footStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold' },
      1: { cellWidth: 68 },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 24, halign: 'right' },
      4: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 16, halign: 'right' },
    },
    margin: { left: 12, right: 12 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // If there is room breakdown, render on Page 2
  if (options?.roomsBreakdown && options.roomsBreakdown.length > 0) {
    doc.addPage();
    renderHeader(2);
    let y2 = 25;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('MULTI-ROOM / ZONE COST ALLOCATION SCHEDULE', 12, y2);
    y2 += 4;

    const roomRows = options.roomsBreakdown.map((r, idx) => [
      `${idx + 1}. ${r.name}`,
      isMetric ? `${r.area.toLocaleString()} m²` : `${r.area.toLocaleString()} sq ft`,
      r.thickness,
      r.rValue,
      r.finish,
      `${r.bags} Bags`,
      `$${r.costPerSqFt.toFixed(2)}`,
      `$${r.estimatedCost.toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: y2,
      theme: 'grid',
      head: [['Zone / Space Name', 'Plan Area', 'Thickness', 'Thermal', 'Finish Spec', 'Fiber Bags', 'Cost / Unit', 'Allocated Cost']],
      body: roomRows,
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: 2,
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: COLORS.textDark,
      },
      columnStyles: {
        0: { cellWidth: 45, fontStyle: 'bold' },
        1: { cellWidth: 24 },
        2: { cellWidth: 20 },
        3: { cellWidth: 18 },
        4: { cellWidth: 28 },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 20, halign: 'right' },
        7: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 12, right: 12 },
    });
  }

  // Watermark Support
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    if (options?.watermark && options.watermark !== 'NONE') {
      addWatermarkToPage(doc, options.watermark);
    }
    renderFooter(p, pageCount);
  }

  const safeTitle = (input.projectName || 'Cost_Estimate').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
  doc.save(`Monoglass_BudgetEstimate_${safeTitle}.pdf`);
  return true;
}




