import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function generateTutorialPdf() {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

  // Palette from DANCE_IN_STYLE
  const cCharcoal = rgb(18 / 255, 20 / 255, 24 / 255);
  const cDarkSlate = rgb(30 / 255, 34 / 255, 42 / 255);
  const cOrange = rgb(255 / 255, 107 / 255, 0 / 255);
  const cSand = rgb(242 / 255, 239 / 255, 233 / 255);
  const cTaupe = rgb(158 / 255, 154 / 255, 144 / 255);
  const cCyan = rgb(6 / 255, 182 / 255, 212 / 255);

  // Helper function to draw header and footer
  const addHeaderAndFooter = (page: any, pageNum: number, totalPages: number) => {
    const { width, height } = page.getSize();

    // Top banner
    page.drawRectangle({
      x: 0,
      y: height - 52,
      width: width,
      height: 52,
      color: cCharcoal,
    });

    page.drawText('DANCE_TUTORIAL | TerraWaltz NISAR Engine', {
      x: 36,
      y: height - 32,
      size: 11,
      font: fontBold,
      color: cOrange,
    });

    page.drawText('NASA Space Apps Challenge 2026', {
      x: width - 210,
      y: height - 32,
      size: 9,
      font: fontRegular,
      color: cSand,
    });

    // Orange hairline
    page.drawLine({
      start: { x: 0, y: height - 52 },
      end: { x: width, y: height - 52 },
      thickness: 1.5,
      color: cOrange,
    });

    // Bottom footer
    page.drawLine({
      start: { x: 36, y: 36 },
      end: { x: width - 36, y: 36 },
      thickness: 0.5,
      color: rgb(200 / 255, 200 / 255, 200 / 255),
    });

    page.drawText('TerraWaltz — Dancing with the SARs · Open Science Protocol', {
      x: 36,
      y: 22,
      size: 8,
      font: fontRegular,
      color: rgb(100 / 255, 100 / 255, 100 / 255),
    });

    page.drawText(`Page ${pageNum} of ${totalPages}`, {
      x: width - 85,
      y: 22,
      size: 8,
      font: fontMono,
      color: rgb(100 / 255, 100 / 255, 100 / 255),
    });
  };

  // -------------------------------------------------------------
  // PAGE 1: Title & 500-Word Speech
  // -------------------------------------------------------------
  const page1 = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width: p1Width, height: p1Height } = page1.getSize();

  let yPos = p1Height - 85;

  page1.drawText('DANCE_TUTORIAL', {
    x: 36,
    y: yPos,
    size: 24,
    font: fontBold,
    color: cCharcoal,
  });

  yPos -= 18;
  page1.drawText('Presentation Speech & Live Demonstration Playbook', {
    x: 36,
    y: yPos,
    size: 13,
    font: fontBold,
    color: cOrange,
  });

  yPos -= 14;
  page1.drawText('TerraWaltz — Multi-Scale Dynamic SAR Fusion Engine for NASA-ISRO NISAR', {
    x: 36,
    y: yPos,
    size: 9.5,
    font: fontRegular,
    color: rgb(80 / 255, 80 / 255, 80 / 255),
  });

  yPos -= 22;

  // Metadata Card Box
  page1.drawRectangle({
    x: 36,
    y: yPos - 38,
    width: p1Width - 72,
    height: 44,
    color: rgb(245 / 255, 246 / 255, 248 / 255),
    borderColor: rgb(220 / 255, 224 / 255, 230 / 255),
    borderWidth: 1,
  });

  page1.drawText('CHALLENGE: Dancing with the SARs (Earth Science / Advanced)    STATUS: Validated L-band & S-band', {
    x: 46,
    y: yPos - 14,
    size: 8,
    font: fontMono,
    color: cCharcoal,
  });
  page1.drawText('FOCUS AREAS: Indian Sundarbans Mangrove Delta & Venezuela Earthquake InSAR Coseismic Slip', {
    x: 46,
    y: yPos - 28,
    size: 8,
    font: fontMono,
    color: rgb(100 / 255, 100 / 255, 100 / 255),
  });

  yPos -= 58;

  // Section 1 Header
  page1.drawText('1. The 500-Word Official Presentation Speech', {
    x: 36,
    y: yPos,
    size: 12,
    font: fontBold,
    color: cCharcoal,
  });
  page1.drawLine({
    start: { x: 36, y: yPos - 4 },
    end: { x: p1Width - 36, y: yPos - 4 },
    thickness: 1,
    color: cOrange,
  });

  yPos -= 18;

  const speechParagraphs = [
    {
      time: '[0:00 - The Hook & The Problem]',
      text: "Most geospatial platforms show us static, cloud-free pictures of Earth. But living environments don't sit still. Just south of Kolkata lies the Indian Sundarbans—the world's largest mangrove delta. Here, with every tide and monsoon cycle, shorelines dissolve, floodplains breathe, and embankments breach. Yet for months during the Southwest monsoon, persistent cloud cover completely blinds optical satellites like Sentinel-2 and Landsat. Optical sensors see white clouds; we see nothing.",
    },
    {
      time: '[0:30 - The Solution & The Physics]',
      text: "To solve this, we built TerraWaltz, a cloud-native SAR fusion engine powered by NASA and ISRO's NISAR radar mission. NISAR does not rely on sunlight. Its active L-band microwaves penetrate dense monsoonal cloud decks and rain cells day or night, imaging the entire delta every twelve days. But raw radar data is notoriously complex—speckle noise, complex digital numbers, phase cycles, and logarithmic decibels. TerraWaltz turns this raw physics into immediate, actionable insight for coastal decision-makers.",
    },
    {
      time: '[1:00 - How the Machine Works]',
      text: "TerraWaltz adheres strictly to the physical radar laws established in our scientific specification. First, we enforce linear-power averaging prior to decibel conversion, eliminating the seven-decibel bias common in naive systems. Second, we use polarization physics intentionally: co-polarized HH captures open water inundation and trunk-water double-bounce, while cross-polarized HV measures canopy volume scattering inside protected mangrove reserves. Third, through repeat-pass interferometry (InSAR), we convert unwrapped phase into line-of-sight surface displacement—proven in our case study mapping sixty centimeters of fault slip following the June 2026 Venezuela earthquakes. Every scan is audited against automated quality gates: speckle noise bounds, coherence thresholds, and data maturity tracking across Provisional and Validated collections.",
    },
    {
      time: '[1:45 - Live Demo Highlights]',
      text: "Across our dashboard, you don't just see numbers. With one click on 'Run AI Radar Scan', TerraWaltz executes a ten-stage pipeline—filtering orbit tracks, calibrating backscatter against Copernicus DEMs, and computing our Surface Change Evidence Index. Using our Swipe Comparator, managers can slide between pre-event baseline photography and post-event backscatter heatmaps. Our Waltz Mode plays back the twelve-day orbital revisit sequence as a rhythmic visual time-lapse, revealing how the delta expands and contracts. Crucially, our Audience Lens lets anyone—from a geodetic scientist inspecting Cramer-Rao phase variance to a district manager monitoring flooded acreage—interrogate the exact same defensible data in their own language.",
    },
    {
      time: '[2:30 - Impact & Future Outlook]',
      text: "TerraWaltz is open source, reproducible, and cloud-optimized to run directly inside AWS us-west-2 with zero egress charges. While NASA's public endpoints undergo scheduled maintenance until November 13th, our architecture links local STAC caches and direct S3 object stores. As NISAR begins its multi-year operational survey, TerraWaltz provides the blueprint for early warning: protecting vulnerable delta communities and proving that when Earth moves, radar lets us dance with its rhythm. Thank you.",
    },
  ];

  function wrapText(text: string, maxLen: number = 96): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const w of words) {
      if ((currentLine + ' ' + w).trim().length > maxLen) {
        lines.push(currentLine.trim());
        currentLine = w;
      } else {
        currentLine += (currentLine ? ' ' : '') + w;
      }
    }
    if (currentLine) lines.push(currentLine.trim());
    return lines;
  }

  for (const block of speechParagraphs) {
    page1.drawText(block.time, {
      x: 36,
      y: yPos,
      size: 8.5,
      font: fontBold,
      color: cOrange,
    });
    yPos -= 11;

    const lines = wrapText(block.text, 98);
    for (const l of lines) {
      page1.drawText(l, {
        x: 36,
        y: yPos,
        size: 8,
        font: fontRegular,
        color: rgb(30 / 255, 30 / 255, 30 / 255),
      });
      yPos -= 9.5;
    }
    yPos -= 4;
  }

  addHeaderAndFooter(page1, 1, 2);

  // -------------------------------------------------------------
  // PAGE 2: Demo Walkthrough Guide & Judge Q&A
  // -------------------------------------------------------------
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  const { width: p2Width, height: p2Height } = page2.getSize();

  let y2 = p2Height - 75;

  page2.drawText('2. Live Demonstration Playbook (Step-by-Step)', {
    x: 36,
    y: y2,
    size: 12,
    font: fontBold,
    color: cCharcoal,
  });
  page2.drawLine({
    start: { x: 36, y: y2 - 4 },
    end: { x: p2Width - 36, y: y2 - 4 },
    thickness: 1,
    color: cOrange,
  });

  y2 -= 18;

  const demoSteps = [
    {
      time: '0:00 - 0:15',
      action: 'Home GIS View (Satellite Basemap)',
      detail: 'Center on Estuary Islands. Show true satellite photography of Sagar & Ghoramara. Point out Hooghly estuary and explain how monsoon clouds blind optical sensors.',
    },
    {
      time: '0:15 - 0:35',
      action: 'Toggle Hotspots & Radar Overlays',
      detail: 'Click Matla Belt, toggle Change Heatmap. Point to neon orange & cyan overlays: "Cyan marks new open water (-10 dB); orange marks double-bounce under flooded trunks."',
    },
    {
      time: '0:35 - 0:55',
      action: 'Trigger "Run AI Radar Scan"',
      detail: 'Click the electric orange button. Show the 10-stage processing modal step through validation, S3 streaming, linear averaging, and quality gates.',
    },
    {
      time: '0:55 - 1:15',
      action: 'Swipe Mode Comparator',
      detail: 'Click Swipe Mode and drag the divider across Ghoramara Island. Contrast pre-event satellite photography against the calibrated post-event SAR backscatter map.',
    },
    {
      time: '1:15 - 1:35',
      action: 'Probe HUD & Audience Lens',
      detail: 'Hover over pixels to demonstrate the real-time PROBE HUD (Lat, Lon, dB, Coherence). Toggle Scientist to Manager to show metrics adapting into hectares and risk levels.',
    },
    {
      time: '1:35 - 1:55',
      action: 'Waltz Mode & Time-Slider',
      detail: 'Activate Waltz Mode. Watch 12-day orbital cycles auto-advance across monsoon. Highlight the permanent gap annotation (27 Jul - 10 Aug) and P05036 validated release.',
    },
    {
      time: '1:55 - 2:15',
      action: 'Venezuela Earthquake Case Study',
      detail: 'Click Venezuela hotspot. Switch to Phase Fringes layer. Show concentric rainbow fringes and 60 cm horizontal fault displacement along the San Sebastian fault.',
    },
    {
      time: '2:15 - 2:30',
      action: 'Math Lab & Cloud API Export',
      detail: 'Open Math Lab tab to showcase the 13/13 verified test vectors. Click Download STAC Item JSON in Cloud API Hub to prove full open-science reproducibility.',
    },
  ];

  for (const step of demoSteps) {
    // Step box
    page2.drawRectangle({
      x: 36,
      y: y2 - 28,
      width: p2Width - 72,
      height: 32,
      color: rgb(248 / 255, 249 / 255, 251 / 255),
      borderColor: rgb(226 / 255, 232 / 255, 240 / 255),
      borderWidth: 0.8,
    });

    page2.drawText(step.time, {
      x: 44,
      y: y2 - 12,
      size: 8,
      font: fontMono,
      color: cOrange,
    });

    page2.drawText(step.action, {
      x: 120,
      y: y2 - 12,
      size: 8.5,
      font: fontBold,
      color: cCharcoal,
    });

    const lines = wrapText(step.detail, 105);
    let detailY = y2 - 22;
    for (const dl of lines.slice(0, 1)) {
      page2.drawText(dl, {
        x: 44,
        y: detailY,
        size: 7.5,
        font: fontRegular,
        color: rgb(70 / 255, 70 / 255, 70 / 255),
      });
    }

    y2 -= 36;
  }

  y2 -= 10;

  // Section 3: Essential Q&A for Evaluators
  page2.drawText('3. Guiding Questions & Evaluator Defense (Section 18.3)', {
    x: 36,
    y: y2,
    size: 11,
    font: fontBold,
    color: cCharcoal,
  });
  page2.drawLine({
    start: { x: 36, y: y2 - 4 },
    end: { x: p2Width - 36, y: y2 - 4 },
    thickness: 1,
    color: cOrange,
  });

  y2 -= 16;

  const qaItems = [
    {
      q: 'Is this real NISAR data?',
      a: 'Yes. Every layer traces to official product IDs (e.g. NISAR_L2_PR_GCOV_026_089...h5), CRIDs (P05023 / P05036), and AWS S3 us-west-2 paths.',
    },
    {
      q: 'Why this polarization?',
      a: 'HH responds to specular surface reflection and double-bounce; HV responds directly to volume scattering inside woody mangrove branches.',
    },
    {
      q: 'Is this vertical displacement?',
      a: 'No. Single geometry yields Line-of-Sight (LOS) only (40 deg look angle). Venezuela strike-slip motion is primarily horizontal east-west.',
    },
    {
      q: 'How do you know change is real?',
      a: 'Comparisons require identical track geometry (Track 089), valid pixel fraction >= 80%, coherence checks, and linear-power averaging.',
    },
  ];

  for (const qa of qaItems) {
    page2.drawText(`Q: ${qa.q}`, {
      x: 36,
      y: y2,
      size: 8,
      font: fontBold,
      color: cCharcoal,
    });
    y2 -= 10;
    page2.drawText(`A: ${qa.a}`, {
      x: 46,
      y: y2,
      size: 7.8,
      font: fontRegular,
      color: rgb(80 / 255, 80 / 255, 80 / 255),
    });
    y2 -= 13;
  }

  addHeaderAndFooter(page2, 2, 2);

  const pdfBytes = await pdfDoc.save();

  // Save to ./DANCE_TUTORIAL.pdf and ./public/DANCE_TUTORIAL.pdf
  fs.writeFileSync(path.resolve(process.cwd(), 'DANCE_TUTORIAL.pdf'), pdfBytes);
  if (!fs.existsSync(path.resolve(process.cwd(), 'public'))) {
    fs.mkdirSync(path.resolve(process.cwd(), 'public'), { recursive: true });
  }
  fs.writeFileSync(path.resolve(process.cwd(), 'public/DANCE_TUTORIAL.pdf'), pdfBytes);

  console.log('Successfully compiled DANCE_TUTORIAL.pdf');
}

generateTutorialPdf().catch(console.error);
