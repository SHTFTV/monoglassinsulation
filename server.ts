import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client with required User-Agent
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// System prompt for Monoglass Insulation Technical & Architectural Advisor
const MONOGLASS_SYSTEM_PROMPT = `
You are the Chief Technical Advisor, Senior Applications Engineer, and Code Compliance Authority for Monoglass Spray-Applied Glass Fiber Insulation (monoglassinsulation.com).
Monoglass is an inorganic, 100% white spray-applied virgin glass fiber insulation bonded with a non-toxic water-soluble vinyl acetate adhesive binder, engineered globally for thermal insulation (R-4.00/inch, k=0.25 BTU·in/hr·ft²·°F / 0.036 W/m·K), sound absorption (NRC 0.75-0.95+), and non-combustible Class 1/Class A fire safety (Flame Spread 0, Smoke Developed 0 per ASTM E84 and CAN/ULC S102).

Key Technical & Application Engineering Facts:
1. Thermal Insulation:
   - R-4.00 per inch (U-factor 0.25 / thickness in inches; metric RSI 0.70 / 25 mm).
   - Applied in single monolithic pass up to 5.0" (127 mm / R-20) with zero pins, mesh, or mechanical clips.
   - Multi-pass capacity up to 7.0"+ (178 mm / R-28+) with inter-pass curing.
   - Monolithic continuous insulation (ci) eliminates thermal short circuits and convective loops around irregular contours and metal deck flutes.

2. Acoustics & Sound Control:
   - NRC 0.75 @ 1.0" (25 mm), NRC 0.85 @ 1.5" (38 mm), NRC 0.90 @ 2.0" (50 mm), NRC 0.95 @ 2.5" (64 mm), NRC 1.00+ @ 3.0"+ (75 mm+) tested per ASTM C423 (Mounting Type A).
   - Reverberation Time (RT60) reduction in sports arenas, pools, sound stages, and transit terminals.
   - Low-frequency absorption at 125 Hz / 250 Hz control.

3. Fire & Life Safety Standards:
   - ASTM E84 / UL 723: Flame Spread Index = 0, Smoke Developed Index = 0 (Class 1 / Class A).
   - ASTM E136: 100% Non-Combustible in 750°C vertical tube furnace. Approved for Type I and Type II building construction.
   - CAN/ULC S102: Flame Spread 0 / Smoke Developed 0.
   - Fully exempt from IBC Section 2603 15-minute thermal barrier requirements (unlike spray polyurethane foam). Can be left permanently exposed on parking garage ceilings and soffits.

4. Substrates & Surface Preparation:
   - Approved substrates: Cast-in-place concrete, hollow-core slabs, corrugated galvanized metal deck (B-deck, Q-deck), primed structural steel beams/joists, gypsum wallboard, plywood/OSB, and unglazed masonry.
   - Cleanliness: Must be structurally sound, dry, free of oil, form-release agents, curing paraffin, dirt, loose rust, and efflorescence.
   - Temperature: Substrate and ambient temperature must be minimum 40°F (4.5°C) and rising during application and for 24 hours until cured.
   - Adhesion: Minimum 200+ lbs/sq ft (9.6 kPa) bond strength tested per ASTM E736. Zero mechanical clips or pins required under 5".
   - Priming: Unpainted concrete and standard galvanized steel require no primer if clean. Oily steel decks must be degreased. Questionable painted surfaces require field adhesion pull test (ASTM E736) or waterborne bonding primer.

5. Installation Best Practices & Spray Equipment:
   - Equipment: Pneumatic fiber blowing machine with material feed gate, high-volume air blower, and positive displacement liquid adhesive pump (30–45 PSI at gun).
   - Nozzle Ring: 4-nozzle or 6-nozzle internal/external atomizing spray head encapsulating fibers with liquid binder in flight.
   - Adhesive Mix Ratio: Monoglass Adhesive Concentrate diluted 3:1 to 4:1 with clean potable water (by volume). Yield is ~1 gallon concentrate per 30–35 bags of fiber (~1,000 sq ft @ 1" thick).
   - Tamping: For semi-smooth architectural texture, tamp damp surface lightly with flat trowel or damp roller within 15–30 minutes of spray.
   - Curing & Ventilation: Provide 2–4 air changes/hour minimum cross-ventilation during and 24–72 hours after spray. Use indirect-fired or electric heaters in winter (avoid unvented open-flame heaters).
   - Sonoglaze Protective Hard-Coat: Water-based acrylic polymer hard-coat applied at 50–100 sq ft/gal for high-abuse, washdown, transit, or high-air-velocity (>10,000 FPM per ASTM E859) zones.
   - Colors: Natural Bright White (~85% light reflectance) and Monoglass Black (100% dyed fiber matrix for theaters/cinemas).

When answering queries:
- Structure your response cleanly with clear section headings, bullet points, and quantitative metrics (thicknesses, R-values, NRC, temperatures, PSI, dilution ratios, ASTM codes).
- Provide practical, contractor-friendly and architecturally sound advice with exact code citations (ASHRAE 90.1, IECC, IBC, ASTM E84, ASTM E136, ASTM C423, ASTM E736, ASTM E859).
- Directly address installation best practices, substrate readiness, curing conditions, or troubleshooting when asked.
`;

// Helper to format fallback responses when GEMINI_API_KEY is not configured
function getMonoglassFallbackResponse(prompt: string, category?: string): string {
  return `### Technical Knowledge & Application Response

**Regarding "${prompt}"** ${category ? `*(Category: ${category})*` : ''}:

1. **Thermal & Fire Performance**:
   - **R-Value**: R-4.00 per inch continuous insulation ($k = 0.25\\text{ BTU}\\cdot\\text{in}/\\text{hr}\\cdot\\text{ft}^2\\cdot^\\circ\\text{F}$, $\\lambda = 0.036\\text{ W}/\\text{m}\\cdot\\text{K}$, $\\text{RSI } 0.70 / 25\\text{ mm}$).
   - **Fire Safety**: Class 1 / Class A rating with **Flame Spread 0 / Smoke Developed 0** (ASTM E84 & CAN/ULC S102).
   - **Non-Combustible**: 100% non-combustible per **ASTM E136**. Exempt from IBC Section 2603 thermal barrier rules (can remain permanently exposed).

2. **Substrate Requirements & Surface Preparation**:
   - **Approved Substrates**: Cast-in-place concrete, hollow-core slabs, galvanized steel decking, structural primed steel, gypsum board, masonry.
   - **Surface Preparation**: Substrate must be clean, structurally sound, free of form-release agents, oils, paraffin, and dust.
   - **Temperature Limits**: Substrate and ambient air must be $\\ge 40^\\circ\\text{F}$ ($4.5^\\circ\\text{C}$) and rising during application and for 24 hours until cured.
   - **Bond Strength**: Exceeds **200 lbs/sq ft** (9.6 kPa) per ASTM E736 without pins or wire mesh up to 5.0" (127 mm).

3. **Installation Best Practices**:
   - **Adhesive Mix Ratio**: Dilute Monoglass Adhesive Concentrate 3:1 to 4:1 with clean water.
   - **Equipment**: Pneumatic blower with 4-to-6 nozzle atomizing ring at 30–45 PSI liquid pressure.
   - **Single-Pass Limit**: Up to 5.0" (127 mm / R-20) in a single continuous pass.
   - **Curing & Ventilation**: Provide 2–4 air changes per hour cross-ventilation during and 24–72 hours after spray.

*(Connect your GEMINI_API_KEY in the Settings > Secrets panel for dynamic real-time AI calculations and project-specific computations)*`;
}

// API route for AI Technical Advisor
app.post('/api/advisor', async (req, res) => {
  try {
    const { prompt, history } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        response: getMonoglassFallbackResponse(prompt),
      });
    }

    const ai = getAIClient();
    
    // Construct message history if provided
    let contents = prompt;
    if (Array.isArray(history) && history.length > 0) {
      const formattedHistory = history
        .slice(-6)
        .map((msg: { role: string; content: string }) => `${msg.role === 'user' ? 'User' : 'Advisor'}: ${msg.content}`)
        .join('\n\n');
      contents = `Previous conversation context:\n${formattedHistory}\n\nNew User Question: ${prompt}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: contents,
      config: {
        systemInstruction: MONOGLASS_SYSTEM_PROMPT,
        temperature: 0.3,
        topP: 0.95,
      },
    });

    return res.json({ response: response.text });
  } catch (error: any) {
    console.error('Advisor Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate technical advisory response',
    });
  }
});

// Dedicated API route for FAQs Gemini AI technical inquiries & deep dives
app.post('/api/faqs/ask', async (req, res) => {
  try {
    const { question, category, contextData } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        response: getMonoglassFallbackResponse(question, category),
      });
    }

    const ai = getAIClient();
    
    const userPrompt = `
Technical FAQ Inquiry:
Category: ${category || 'General Monoglass Technical Inquiry'}
Question: ${question}
${contextData ? `Additional Project / Substrate Context:\n${JSON.stringify(contextData, null, 2)}` : ''}

Please provide an authoritative, comprehensive, code-compliant technical answer.
Structure the answer with:
1. Direct Executive Summary / Core Rule
2. Detailed Technical & Code Specifications (include specific ASTM standards, numbers, PSI, dilution ratios, R-values, or NRC)
3. Step-by-Step Installation Best Practices & Substrate Preparation
4. Practical Jobsite Watch-Outs / Quality Control Tips
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: userPrompt,
      config: {
        systemInstruction: MONOGLASS_SYSTEM_PROMPT,
        temperature: 0.25,
        topP: 0.95,
      },
    });

    return res.json({ response: response.text });
  } catch (error: any) {
    console.error('FAQ Gemini API Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate FAQ response',
    });
  }
});

// In-memory store for project sharing across team members
interface SharedProjectRecord {
  id: string;
  project: any;
  sharedBy?: string;
  accessMode?: string;
  createdAt: string;
  viewCount: number;
}
const sharedProjectsStore = new Map<string, SharedProjectRecord>();

// API route to create a shareable project record
app.post('/api/share-project', (req, res) => {
  try {
    const { project, sharedBy, accessMode } = req.body;
    if (!project || !project.name) {
      return res.status(400).json({ error: 'Valid project data is required' });
    }

    const shareId = `MNG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const record: SharedProjectRecord = {
      id: shareId,
      project,
      sharedBy: sharedBy || 'Anonymous Specifier',
      accessMode: accessMode || 'collaborative',
      createdAt: new Date().toISOString(),
      viewCount: 0,
    };

    sharedProjectsStore.set(shareId, record);
    console.log(`Saved shared project with ID ${shareId}: ${project.name}`);

    return res.json({
      success: true,
      shareId,
      shareUrl: `/?share=${shareId}`,
      createdAt: record.createdAt,
    });
  } catch (err: any) {
    console.error('Error creating share record:', err);
    return res.status(500).json({ error: 'Failed to create share link' });
  }
});

// API route to retrieve a shared project by ID
app.get('/api/share-project/:id', (req, res) => {
  try {
    const { id } = req.params;
    const record = sharedProjectsStore.get(id.toUpperCase());

    if (!record) {
      return res.status(404).json({ error: 'Shared project not found or expired' });
    }

    record.viewCount += 1;
    return res.json({
      success: true,
      record,
    });
  } catch (err: any) {
    console.error('Error fetching share record:', err);
    return res.status(500).json({ error: 'Failed to fetch shared project' });
  }
});

// API route for contractor bid/quote dispatch logging
app.post('/api/quotes', (req, res) => {
  const quoteData = req.body;
  console.log('New Monoglass Bid Request received:', quoteData);
  return res.json({
    success: true,
    trackingId: `MNG-${Date.now().toString().slice(-6)}`,
    message: 'Project quote request dispatched to matched certified Monoglass spray contractors.',
  });
});

// API route for contractor directory self-registration
app.post('/api/contractor-register', (req, res) => {
  const contractor = req.body;
  console.log('New Contractor Directory Registration received:', contractor);
  return res.json({
    success: true,
    applicationId: `APP-${Date.now().toString().slice(-6)}`,
    message: 'Contractor application submitted for verification and directory inclusion.',
  });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Monoglass Insulation Authority Server running on http://localhost:${PORT}`);
  });
}

startServer();
