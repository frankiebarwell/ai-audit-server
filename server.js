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

// ── Claude: generate tailored questionnaire ──────────────────────────────────

async function generateQuestionnaire(clientName, companyName, industry) {
  const prompt = `Do not use emojis. Do not use markdown formatting — no #, ##, **, or similar symbols. Write in plain text only, using capitalised section headings and clear spacing.

You are preparing a pre-audit questionnaire to send to a prospective client ahead of a 30-minute AI Readiness Audit session. The questionnaire will be emailed to them directly.

Client: ${clientName}
Company: ${companyName}
Industry: ${industry}

Write a personalised questionnaire with exactly 6 sections and 26 questions total. Address the client by their first name in the introduction. Keep the tone warm, direct, and professional — not corporate or stiff.

Sections:
1. YOUR BUSINESS AT A GLANCE (5 questions) — staff, tenure, revenue streams, typical week, what keeps them up at night
2. SALES AND NEW BUSINESS (4 questions) — how they generate clients, sales process, follow-up, biggest frustration
3. DAY-TO-DAY OPERATIONS (5 questions) — tailor these specifically to a ${industry}. Think about their version of client delivery, the admin that repeats every week, the software they likely use, where time disappears. These should feel like they were written by someone who knows this type of business well.
4. MARKETING AND VISIBILITY (4 questions) — social media, email communications, paid advertising, biggest frustration
5. TECHNOLOGY AND AI (4 questions) — current AI tool usage, tech comfort level, team resistance, areas they'd keep human
6. GOALS AND PRIORITIES (4 questions) — 90-day problem to solve, task they'd eliminate, revenue opportunity, what success looks like in 6 months

End with a short closing note thanking them by first name and asking them to return the completed questionnaire to frankie@option10.com at least 24 hours before their session.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();
  if (!data?.content?.[0]?.text) throw new Error('Claude returned no content for questionnaire');
  return data.content[0].text;
}

// ── In-memory stores ─────────────────────────────────────────────────────────
// Pending client context — set by web form, consumed by next Fireflies webhook
let pendingClient = null;

// Active audits — keyed by Fireflies meeting ID
// Maps meetingId -> { title, clientName, companyName, industry, transcript, analysis }
const auditStore = {};

// ── Routes ───────────────────────────────────────────────────────────────────

const CARD_STYLES = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #f0f2f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { background: #fff; border-radius: 10px; overflow: hidden; width: 100%; max-width: 520px; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
    .header { background: #1A2744; padding: 28px 32px; }
    .header h1 { color: #C8A951; font-size: 22px; font-weight: bold; letter-spacing: 0.3px; }
    .header p { color: #a0aec0; font-size: 14px; margin-top: 4px; }
    .body { padding: 32px; }
    .field { margin-bottom: 22px; }
    label { display: block; font-size: 14px; font-weight: bold; color: #1A2744; margin-bottom: 8px; }
    input { width: 100%; padding: 12px 14px; border: 1.5px solid #dde1e9; border-radius: 6px; font-size: 15px; color: #222; outline: none; transition: border-color 0.2s; background: #fff; }
    input:focus { border-color: #1A2744; }
    input::placeholder { color: #b0b8c9; }
    .btn { width: 100%; padding: 14px; background: #1A2744; color: #C8A951; font-size: 16px; font-weight: bold; border: none; border-radius: 6px; cursor: pointer; letter-spacing: 0.4px; transition: opacity 0.2s; margin-top: 6px; }
    .btn:hover { opacity: 0.88; }
    .body p { color: #444; font-size: 15px; line-height: 1.6; margin-bottom: 12px; }
    .body strong { color: #1A2744; }
    .footer { padding: 16px 32px; border-top: 1px solid #f0f2f5; text-align: center; }
    .footer p { font-size: 12px; color: #b0b8c9; }
`;

// Dashboard — new audit entry form
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Option 10 — AI Audit System</title>
  <style>${CARD_STYLES}</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Option 10</h1>
      <p>AI Readiness Audit — New Session</p>
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
          <label for="clientEmail">Client Email</label>
          <input type="email" id="clientEmail" name="clientEmail" placeholder="e.g. sarah@apexlegal.com" required>
        </div>
        <button type="submit" class="btn">Send Questionnaire</button>
      </form>
    </div>
    <div class="footer">
      <p>Option 10 AI Audit System</p>
    </div>
  </div>
</body>
</html>`);
});

// Handle form submission — generate questionnaire, email client, store pending context
app.post('/start', async (req, res) => {
  const { clientName, companyName, industry, clientEmail } = req.body;

  if (!clientName || !companyName || !industry || !clientEmail) {
    return res.status(400).send('All fields are required.');
  }

  // Respond immediately so the browser doesn't hang
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Option 10 — Sending</title>
  <style>${CARD_STYLES}</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Option 10</h1>
      <p>AI Readiness Audit — New Session</p>
    </div>
    <div class="body">
      <p>Generating a tailored questionnaire for <strong>${clientName}</strong> at <strong>${companyName}</strong>.</p>
      <p>It will be emailed to <strong>${clientEmail}</strong> in approximately 30 seconds.</p>
      <p>You will receive a confirmation once it has been sent.</p>
    </div>
    <div class="footer">
      <p>Option 10 AI Audit System</p>
    </div>
  </div>
</body>
</html>`);

  console.log(`New audit: ${clientName} — ${companyName} (${industry}) — ${clientEmail}`);

  try {
    // Generate tailored questionnaire via Claude
    const questionnaire = await generateQuestionnaire(clientName, companyName, industry);

    // Store as pending — consumed by next Fireflies webhook
    pendingClient = { clientName, companyName, industry, clientEmail };
    console.log(`Pending client set: ${clientName} — ${companyName}`);

    // Email questionnaire to client
    await transporter.sendMail({
      from: GMAIL_USER,
      to: clientEmail,
      subject: `Your AI Readiness Audit — A Few Questions Before We Meet`,
      html: `
        <div style="font-family:Arial;max-width:600px;margin:0 auto">
          <div style="background:#1A2744;padding:24px 32px">
            <h1 style="color:#C8A951;font-size:20px;margin:0">Option 10</h1>
            <p style="color:#a0aec0;font-size:13px;margin:6px 0 0">AI Readiness Audit</p>
          </div>
          <div style="padding:32px;background:#fff">
            <pre style="font-family:Arial;font-size:14px;white-space:pre-wrap;line-height:1.7;color:#333">${questionnaire}</pre>
          </div>
          <div style="padding:16px 32px;background:#f8f8f8;text-align:center">
            <p style="font-size:12px;color:#999">Option 10 | frankie@option10.com</p>
          </div>
        </div>
      `
    });

    console.log(`Questionnaire emailed to ${clientEmail}`);

    // Notify Frankie
    await transporter.sendMail({
      from: GMAIL_USER,
      to: NOTIFY_EMAIL,
      subject: `Questionnaire Sent — ${clientName}, ${companyName}`,
      html: `
        <p><strong>The pre-audit questionnaire has been sent.</strong></p>
        <p><strong>Client:</strong> ${clientName}</p>
        <p><strong>Company:</strong> ${companyName}</p>
        <p><strong>Industry:</strong> ${industry}</p>
        <p><strong>Sent to:</strong> ${clientEmail}</p>
        <p>The system is now waiting for the Fireflies webhook after your session. The client context will be applied automatically when the recording is processed.</p>
        <br><p style="color:#888">Option 10 AI Audit System</p>
      `
    });

    console.log(`Confirmation email sent to ${NOTIFY_EMAIL}`);
  } catch (err) {
    console.error('Start error:', err.message);
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

    // Apply pending client context if available, otherwise fall back to meeting title
    const context = pendingClient || {};
    const displayTitle = context.clientName
      ? `${context.clientName} — ${context.companyName}`
      : title;

    auditStore[meetingId] = {
      title: displayTitle,
      clientName: context.clientName || '',
      companyName: context.companyName || '',
      industry: context.industry || '',
      transcript: text,
      analysis: null
    };

    // Clear pending client now that it's been consumed
    if (pendingClient) {
      console.log(`Phase 1: Applied pending context for ${displayTitle}`);
      pendingClient = null;
    }

    console.log('Phase 1: Transcript fetched for:', displayTitle);

    await transporter.sendMail({
      from: GMAIL_USER,
      to: NOTIFY_EMAIL,
      subject: `AI Audit for ${displayTitle} is Ready`,
      html: `
        <p><strong>A new AI Readiness Audit transcript is ready.</strong></p>
        <p><strong>Client:</strong> ${displayTitle}</p>
        ${context.industry ? `<p><strong>Industry:</strong> ${context.industry}</p>` : ''}
        <p><strong>Transcript length:</strong> ${text.split(' ').length} words</p>
        <p><strong>Meeting ID:</strong> ${meetingId}</p>
        <p>When you are ready to run the AI analysis, click the button below:</p>
        <p><a href="https://ai-audit-server-production-b423.up.railway.app/analyse/${meetingId}" style="background:#1A2744;color:#C8A951;padding:12px 24px;text-decoration:none;font-weight:bold;border-radius:4px">Generate Consultant Briefing</a></p>
        <br><p style="color:#888">Option 10 AI Audit System</p>
      `
    });

    console.log('Phase 1: Notification email sent for:', displayTitle);
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
    const analysis = await analyseTranscript(audit.transcript, { clientName: audit.clientName, companyName: audit.companyName, industry: audit.industry });
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
    const analysis = await analyseTranscript(audit.transcript, { clientName: audit.clientName, companyName: audit.companyName, industry: audit.industry });
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
