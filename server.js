const express = require('express');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const {
  FIREFLIES_API_KEY,
  ANTHROPIC_API_KEY,
  GMAIL_USER,
  GMAIL_APP_PASSWORD,
  NOTIFY_EMAIL
} = process.env;

// ── Gmail transport ──────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD
  }
});

// ── Fireflies: fetch transcript ──────────────────────────────────────────────

async function fetchTranscript(meetingId) {
  const response = await fetch('https://api.fireflies.ai/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIREFLIES_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `query GetTranscript($id: String!) {
        transcript(id: $id) {
          title
          sentences { raw_text }
        }
      }`,
      variables: { id: meetingId }
    })
  });

  const data = await response.json();
  const transcript = data?.data?.transcript;
  if (!transcript) throw new Error('Transcript not found for meeting ID: ' + meetingId);

  const text = transcript.sentences.map(s => s.raw_text).join(' ');
  return { title: transcript.title || 'AI Readiness Audit', text };
}

// ── Claude: analyse transcript ───────────────────────────────────────────────

async function analyseTranscript(transcriptText, context = {}) {
  const clientContext = context.clientName
    ? `Client: ${context.clientName} | Company: ${context.companyName} | Industry: ${context.industry}\n\n`
    : '';

  const prompt = `Do not use emojis. Do not use markdown formatting — no #, ##, **, or similar symbols. Write in plain professional text only, using capitalised section headings and clear paragraph breaks.

You are an expert AI implementation consultant with a direct, no-nonsense style. A client has just completed a 30-minute AI Readiness Audit session. You are preparing your internal working notes — a structured consultant briefing that will inform your recommendations and proposal.

${clientContext}

Write with confidence and specificity. You are a seasoned operator who has seen this pattern before, not an academic summarising a case study. Your observations should feel like a sharp consultant talking to a trusted colleague — direct, candid, occasionally wry. Call things what they are. If the business is a mess, say so. If the opportunity is obvious, say so. This is for your eyes only.

Analyse the transcript below and produce a detailed internal report with the following sections:

1. MEETING OVERVIEW
Client name and business. Industry. Your honest first impression of their AI readiness in 2-3 sentences — don't sanitise it.

2. CURRENT STATE ASSESSMENT
What tools and technology does the client currently use? What processes are manual or inefficient? Where is time being lost? How comfortable are they with technology and AI — and how does that shape the conversation ahead?

3. PAIN POINTS AND PRIORITIES
The 3-5 most significant problems or frustrations the client expressed. Quote directly where possible. Note which feel most urgent — and which they may not have fully articulated yet.

4. AI READINESS SCORE
Score the client across these 6 dimensions (1-5 scale with brief rationale for each):
- Technology Infrastructure
- Data and Process Documentation
- Team Capability and Openness
- Budget and Investment Appetite
- Decision-Making Speed
- Overall Strategic Clarity
Overall readiness score out of 30.

5. TOP AUTOMATION OPPORTUNITIES
List the 5-7 highest-impact AI automation opportunities specific to this client. For each: what it automates, estimated time saved per week, complexity (low/medium/high), and ROI category. Be specific — generic observations are useless here.

6. QUICK WINS
The 3 things that could be implemented within 30 days with minimal disruption and visible impact. These should feel genuinely achievable, not aspirational fluff.

7. CONSULTANT NOTES
Buying signals, hesitations, objections raised, red flags, or anything that should shape how you position the proposal. Be completely candid — this is your private read on the client and the room.

TRANSCRIPT:
${transcriptText}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();
  if (!data?.content?.[0]?.text) throw new Error('Claude returned no content: ' + JSON.stringify(data));
  return data.content[0].text;
}

// ── Claude: generate proposal ────────────────────────────────────────────────

async function generateProposal(analysisText) {
  const prompt = `Do not use emojis. Do not use markdown formatting — no #, ##, **, or similar symbols. Write in plain professional text only, using capitalised section headings and clear paragraph breaks.

You are an expert AI implementation consultant preparing a tailored proposal for a prospective client following their AI Readiness Audit session.

Using the internal analysis report below, write a professional client-facing proposal document. The tone should feel like a senior advisor who has done their homework — authoritative, warm, and specific. The client should feel genuinely understood, not processed. Write as someone who has diagnosed their situation precisely and has a clear plan for what to build. Avoid corporate filler. Every sentence should earn its place.

Structure the proposal as follows:

1. EXECUTIVE SUMMARY
2-3 paragraphs. Acknowledge what you heard in the audit. Name the core challenge without sugarcoating it. Position AI implementation as the specific lever that changes the trajectory — not AI in the abstract, but the work you will do together.

2. YOUR SITUATION
A direct, empathetic summary of where the client is today. Make them feel deeply understood. Use specifics from the audit. This section should feel like you were paying close attention — because you were.

3. WHAT WE WILL BUILD
The specific AI systems and automations recommended. Name the tools. Describe what each does in plain language a smart business owner will immediately grasp. State the business outcome each one delivers — not the feature, the result.

4. WHAT THIS MEANS FOR YOUR BUSINESS
Quantify where possible: time saved per week, estimated revenue impact, cost reduction, client experience improvement. Be specific. Round numbers are fine. Vague promises are not.

5. IMPLEMENTATION ROADMAP
A simple 30/60/90 day timeline. What gets built in each phase. Keep it practical and sequenced — early wins first, complexity later.

6. YOUR INVESTMENT
Option 10 AI Growth Accelerator: $5,000/month over 3 months ($15,000 total). Frame as an investment with a clear return. Note that the $497 Audit fee is credited against Month 1 if they proceed within 14 days.

7. NEXT STEPS
One clear action: reply to book a 45-minute proposal walkthrough call. Make it easy and low-friction.

INTERNAL ANALYSIS:
${analysisText}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();
  if (!data?.content?.[0]?.text) throw new Error('Claude returned no content: ' + JSON.stringify(data));
  return data.content[0].text;
}

// ── In-memory store for pending audits ──────────────────────────────────────
// Maps meetingId -> { title, transcript, analysis }
const auditStore = {};

// ── Routes ───────────────────────────────────────────────────────────────────

// Dashboard — entry form
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Option 10 — AI Audit System</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #f0f2f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { background: #fff; border-radius: 10px; overflow: hidden; width: 100%; max-width: 520px; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
    .header { background: #1A2744; padding: 28px 32px; }
    .header h1 { color: #C8A951; font-size: 22px; font-weight: bold; letter-spacing: 0.3px; }
    .header p { color: #a0aec0; font-size: 14px; margin-top: 4px; }
    .body { padding: 32px; }
    .field { margin-bottom: 22px; }
    label { display: block; font-size: 14px; font-weight: bold; color: #1A2744; margin-bottom: 8px; }
    input, select { width: 100%; padding: 12px 14px; border: 1.5px solid #dde1e9; border-radius: 6px; font-size: 15px; color: #222; outline: none; transition: border-color 0.2s; background: #fff; }
    input:focus, select:focus { border-color: #1A2744; }
    input::placeholder { color: #b0b8c9; }
    .btn { width: 100%; padding: 14px; background: #1A2744; color: #C8A951; font-size: 16px; font-weight: bold; border: none; border-radius: 6px; cursor: pointer; letter-spacing: 0.4px; transition: opacity 0.2s; margin-top: 6px; }
    .btn:hover { opacity: 0.88; }
    .footer { padding: 16px 32px; border-top: 1px solid #f0f2f5; text-align: center; }
    .footer p { font-size: 12px; color: #b0b8c9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Option 10</h1>
      <p>AI Readiness Audit — Session Launcher</p>
    </div>
    <div class="body">
      <form action="/start" method="POST">
        <div class="field">
          <label for="clientName">Client Name</label>
          <input type="text" id="clientName" name="clientName" placeholder="e.g. Sarah Johnson" required>
        </div>
        <div class="field">
          <label for="companyName">Company / Business Name</label>
          <input type="text" id="companyName" name="companyName" placeholder="e.g. Apex Legal" required>
        </div>
        <div class="field">
          <label for="industry">Industry</label>
          <input type="text" id="industry" name="industry" placeholder="e.g. Employment law firm" required>
        </div>
        <div class="field">
          <label for="meetingId">Fireflies Meeting ID</label>
          <input type="text" id="meetingId" name="meetingId" placeholder="e.g. 01KPYSGPEM5TWCKFBE2TVQY1PM" required>
        </div>
        <button type="submit" class="btn">Launch Audit</button>
      </form>
    </div>
    <div class="footer">
      <p>Option 10 AI Audit System</p>
    </div>
  </div>
</body>
</html>`);
});

// Handle form submission — prime context and trigger analysis pipeline
app.post('/start', async (req, res) => {
  const { clientName, companyName, industry, meetingId } = req.body;

  if (!clientName || !companyName || !industry || !meetingId) {
    return res.status(400).send('All fields are required.');
  }

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Option 10 — Processing</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #f0f2f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { background: #fff; border-radius: 10px; overflow: hidden; width: 100%; max-width: 520px; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
    .header { background: #1A2744; padding: 28px 32px; }
    .header h1 { color: #C8A951; font-size: 22px; font-weight: bold; }
    .header p { color: #a0aec0; font-size: 14px; margin-top: 4px; }
    .body { padding: 32px; }
    .body p { color: #444; font-size: 15px; line-height: 1.6; margin-bottom: 12px; }
    .body strong { color: #1A2744; }
    .footer { padding: 16px 32px; border-top: 1px solid #f0f2f5; text-align: center; }
    .footer p { font-size: 12px; color: #b0b8c9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Option 10</h1>
      <p>AI Readiness Audit — Processing</p>
    </div>
    <div class="body">
      <p>The audit is running for <strong>${clientName}</strong> at <strong>${companyName}</strong>.</p>
      <p>Fetching the transcript and generating your consultant briefing now. You will receive an email in approximately 60 seconds.</p>
    </div>
    <div class="footer">
      <p>Option 10 AI Audit System</p>
    </div>
  </div>
</body>
</html>`);

  console.log(`Web form: Starting audit for ${clientName} — ${companyName} (${industry})`);

  try {
    const { title, text } = await fetchTranscript(meetingId);
    const enrichedTitle = `${clientName} — ${companyName}`;
    auditStore[meetingId] = {
      title: enrichedTitle,
      clientName,
      companyName,
      industry,
      transcript: text,
      analysis: null
    };

    console.log(`Web form: Transcript fetched for ${enrichedTitle}`);

    const analysis = await analyseTranscript(text, { clientName, companyName, industry });
    auditStore[meetingId].analysis = analysis;

    await transporter.sendMail({
      from: GMAIL_USER,
      to: NOTIFY_EMAIL,
      subject: `AI Analysis for ${enrichedTitle} is Ready`,
      html: `
        <p><strong>Your AI Readiness Analysis is complete.</strong></p>
        <p><strong>Client:</strong> ${enrichedTitle}</p>
        <p><strong>Industry:</strong> ${industry}</p>
        <p><strong>Meeting ID:</strong> ${meetingId}</p>
        <hr>
        <pre style="font-family:Arial;font-size:14px;white-space:pre-wrap">${analysis}</pre>
        <hr>
        <p>When ready for the client proposal, click below:</p>
        <p><a href="https://ai-audit-server-production-b423.up.railway.app/propose/${meetingId}" style="background:#1A2744;color:#C8A951;padding:12px 24px;text-decoration:none;font-weight:bold;border-radius:4px">Generate Client Proposal</a></p>
        <br><p style="color:#888">Option 10 AI Audit System</p>
      `
    });

    console.log(`Web form: Analysis email sent for ${enrichedTitle}`);
  } catch (err) {
    console.error('Web form error:', err.message);
  }
});

// Phase 1: Fireflies webhook fires when meeting is transcribed
app.post('/webhook/fireflies', async (req, res) => {
  res.sendStatus(200); // acknowledge immediately

  const meetingId = req.body.meeting_id || req.body.meetingId;
  if (!meetingId) {
    console.error('No meeting_id in webhook payload:', req.body);
    return;
  }

  console.log('Phase 1: Received webhook for meeting:', meetingId);

  try {
    const { title, text } = await fetchTranscript(meetingId);
    auditStore[meetingId] = { title, transcript: text, analysis: null };

    console.log('Phase 1: Transcript fetched for:', title);

    await transporter.sendMail({
      from: GMAIL_USER,
      to: NOTIFY_EMAIL,
      subject: `AI Audit for ${title} is Ready`,
      html: `
        <p><strong>A new AI Readiness Audit transcript is ready.</strong></p>
        <p><strong>Client:</strong> ${title}</p>
        <p><strong>Transcript length:</strong> ${text.split(' ').length} words</p>
        <p><strong>Meeting ID:</strong> ${meetingId}</p>
        <p>When you are ready to run the AI analysis, click the button below:</p>
        <p><a href="https://ai-audit-server-production-b423.up.railway.app/analyse/${meetingId}" style="background:#1A2744;color:#C8A951;padding:12px 24px;text-decoration:none;font-weight:bold;border-radius:4px">Generate Consultant Briefing</a></p>
        <br><p style="color:#888">Option 10 AI Audit System</p>
      `
    });

    console.log('Phase 1: Notification email sent for:', title);
  } catch (err) {
    console.error('Phase 1 error:', err.message);
  }
});

// Phase 2: GET version so you can click a link in the email
app.get('/analyse/:meetingId', async (req, res) => {
  res.send(`<html><body style="font-family:Arial;padding:40px">
    <h2>Triggering analysis...</h2>
    <p>The consultant briefing is being generated. You will receive an email in approximately 60 seconds.</p>
    <p style="color:#888">Option 10 AI Audit System</p>
  </body></html>`);
  const { meetingId } = req.params;
  const audit = auditStore[meetingId];
  if (!audit) { console.error('Phase 2 GET: No audit found for meeting:', meetingId); return; }
  try {
    const analysis = await analyseTranscript(audit.transcript);
    auditStore[meetingId].analysis = analysis;
    await transporter.sendMail({
      from: GMAIL_USER, to: NOTIFY_EMAIL,
      subject: `AI Analysis for ${audit.title} is Ready`,
      html: `<p><strong>Your AI Readiness Analysis is complete.</strong></p><p><strong>Client:</strong> ${audit.title}</p><p><strong>Meeting ID:</strong> ${meetingId}</p><hr><pre style="font-family:Arial;font-size:14px;white-space:pre-wrap">${analysis}</pre><hr><p>When ready for the client proposal, click below:</p><p><a href="https://ai-audit-server-production-b423.up.railway.app/propose/${meetingId}" style="background:#1A2744;color:#C8A951;padding:12px 24px;text-decoration:none;font-weight:bold;border-radius:4px">Generate Client Proposal</a></p><br><p style="color:#888">Option 10 AI Audit System</p>`
    });
    console.log('Phase 2 GET: Analysis email sent for:', audit.title);
  } catch (err) { console.error('Phase 2 GET error:', err.message); }
});

// Phase 2: POST version (keep for backwards compatibility)
app.post('/analyse/:meetingId', async (req, res) => {
  res.sendStatus(200);

  const { meetingId } = req.params;
  const audit = auditStore[meetingId];

  if (!audit) {
    console.error('Phase 2: No audit found for meeting:', meetingId);
    return;
  }

  console.log('Phase 2: Running analysis for:', audit.title);

  try {
    const analysis = await analyseTranscript(audit.transcript);
    auditStore[meetingId].analysis = analysis;

    await transporter.sendMail({
      from: GMAIL_USER,
      to: NOTIFY_EMAIL,
      subject: `AI Analysis for ${audit.title} is Ready`,
      html: `
        <p><strong>Your AI Readiness Analysis is complete.</strong></p>
        <p><strong>Client:</strong> ${audit.title}</p>
        <p><strong>Meeting ID:</strong> ${meetingId}</p>
        <hr>
        <pre style="font-family:Arial;font-size:14px;white-space:pre-wrap">${analysis}</pre>
        <hr>
        <p>When you are ready to generate the client proposal, reply to this email with the single word:</p>
        <p><strong>PROPOSE</strong></p>
        <br><p style="color:#888">Option 10 AI Audit System</p>
      `
    });

    console.log('Phase 2: Analysis email sent for:', audit.title);
  } catch (err) {
    console.error('Phase 2 error:', err.message);
  }
});

// Phase 3: GET version so you can click a link in the email
app.get('/propose/:meetingId', async (req, res) => {
  res.send(`<html><body style="font-family:Arial;padding:40px">
    <h2>Generating client proposal...</h2>
    <p>The proposal is being written. You will receive an email in approximately 60 seconds.</p>
    <p style="color:#888">Option 10 AI Audit System</p>
  </body></html>`);
  const { meetingId } = req.params;
  const audit = auditStore[meetingId];
  if (!audit || !audit.analysis) { console.error('Phase 3 GET: No analysis found for meeting:', meetingId); return; }
  try {
    const proposal = await generateProposal(audit.analysis);
    await transporter.sendMail({
      from: GMAIL_USER, to: NOTIFY_EMAIL,
      subject: `AI Proposal for ${audit.title} is Ready`,
      html: `<p><strong>The client proposal draft is complete.</strong></p><p><strong>Client:</strong> ${audit.title}</p><hr><pre style="font-family:Arial;font-size:14px;white-space:pre-wrap">${proposal}</pre><hr><p>Review and edit before sending to the client.</p><br><p style="color:#888">Option 10 AI Audit System</p>`
    });
    console.log('Phase 3 GET: Proposal email sent for:', audit.title);
  } catch (err) { console.error('Phase 3 GET error:', err.message); }
});

// Phase 3: POST version (keep for backwards compatibility)
app.post('/propose/:meetingId', async (req, res) => {
  res.sendStatus(200);

  const { meetingId } = req.params;
  const audit = auditStore[meetingId];

  if (!audit || !audit.analysis) {
    console.error('Phase 3: No analysis found for meeting:', meetingId);
    return;
  }

  console.log('Phase 3: Generating proposal for:', audit.title);

  try {
    const proposal = await generateProposal(audit.analysis);

    await transporter.sendMail({
      from: GMAIL_USER,
      to: NOTIFY_EMAIL,
      subject: `AI Proposal for ${audit.title} is Ready`,
      html: `
        <p><strong>The client proposal draft is complete.</strong></p>
        <p><strong>Client:</strong> ${audit.title}</p>
        <hr>
        <pre style="font-family:Arial;font-size:14px;white-space:pre-wrap">${proposal}</pre>
        <hr>
        <p>Review and edit before sending to the client.</p>
        <br><p style="color:#888">Option 10 AI Audit System</p>
      `
    });

    console.log('Phase 3: Proposal email sent for:', audit.title);
  } catch (err) {
    console.error('Phase 3 error:', err.message);
  }
});

// ── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AI Audit Server listening on port ${PORT}`));
