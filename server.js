const express = require('express');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

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

async function analyseTranscript(transcriptText) {
  const prompt = `Do not use emojis. Write in plain professional text only.

You are an expert AI implementation consultant. A client has just completed a 30-minute AI Readiness Audit session. You are preparing your internal working notes — a structured consultant briefing that will inform your recommendations and proposal.

Analyse the transcript below and produce a detailed internal report with the following sections:

1. MEETING OVERVIEW
Client name and business. Industry. Overall AI readiness impression in 2-3 sentences.

2. CURRENT STATE ASSESSMENT
What tools and technology does the client currently use? What processes are manual or inefficient? Where is time being lost? Their current comfort level with technology and AI?

3. PAIN POINTS AND PRIORITIES
The 3-5 most significant problems or frustrations the client expressed. Quote directly where possible. Note which feel most urgent.

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
List the 5-7 highest-impact AI automation opportunities specific to this client. For each: what it automates, estimated time saved per week, complexity (low/medium/high), and ROI category.

6. QUICK WINS
The 3 things that could be implemented within 30 days with minimal disruption and visible impact.

7. CONSULTANT NOTES
Any hesitations, buying signals, objections raised, or anything that should inform how you position the proposal. Be candid — this is for your eyes only.

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
  const prompt = `Do not use emojis. Write in plain professional text only.

You are an expert AI implementation consultant preparing a tailored proposal for a prospective client following their AI Readiness Audit session.

Using the internal analysis report below, write a professional client-facing proposal document. This should feel authoritative, specific to their situation, and clearly articulate the value of moving forward.

Structure the proposal as follows:

1. EXECUTIVE SUMMARY
2-3 paragraphs. Acknowledge what you heard. Name the core challenge. Position AI implementation as the lever that changes the trajectory.

2. YOUR SITUATION
A brief, empathetic summary of where the client is today. Make them feel deeply understood. Use specifics from the audit.

3. WHAT WE WILL BUILD
The specific AI systems and automations recommended. Name the tools. Describe what each does in plain language. State the business outcome it delivers.

4. WHAT THIS MEANS FOR YOUR BUSINESS
Quantify where possible: time saved per week, estimated revenue impact, cost reduction, client experience improvement.

5. IMPLEMENTATION ROADMAP
A simple 30/60/90 day timeline. What gets built in each phase.

6. YOUR INVESTMENT
Option 10 AI Growth Accelerator: $5,000/month over 3 months ($15,000 total). Frame as an investment with a clear return. Note that the $497 Audit fee is credited against Month 1 if they proceed within 14 days.

7. NEXT STEPS
One clear action: reply to book a 45-minute proposal walkthrough call.

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

// Health check
app.get('/', (req, res) => res.send('AI Audit Server running.'));

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
      subject: `AI Audit Ready — ${title} | MeetingID:${meetingId}`,
      html: `
        <p><strong>A new AI Readiness Audit transcript is ready.</strong></p>
        <p><strong>Client:</strong> ${title}</p>
        <p><strong>Transcript length:</strong> ${text.split(' ').length} words</p>
        <p>When you are ready to run the AI analysis, reply to this email with the single word:</p>
        <p><strong>ANALYSE</strong></p>
        <p>The system will then read the transcript and produce your internal consultant briefing.</p>
        <br><p style="color:#888">Option 10 AI Audit System</p>
      `
    });

    console.log('Phase 1: Notification email sent for:', title);
  } catch (err) {
    console.error('Phase 1 error:', err.message);
  }
});

// Phase 2: Frankie replies ANALYSE — call this endpoint
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
      subject: `Analysis Ready — ${audit.title} | MeetingID:${meetingId}`,
      html: `
        <p><strong>Your AI Readiness Analysis is complete.</strong></p>
        <p><strong>Client:</strong> ${audit.title}</p>
        <hr>
        <pre style="font-family:Arial;font-size:14px;white-space:pre-wrap">${analysis}</pre>
        <hr>
        <p>When you are ready to generate the client proposal, reply to this email with the single word:</p>
        <p><strong>PROPOSE</strong></p>
        <br><p style="color:#888">Option 10 AI Audit System | MeetingID:${meetingId}</p>
      `
    });

    console.log('Phase 2: Analysis email sent for:', audit.title);
  } catch (err) {
    console.error('Phase 2 error:', err.message);
  }
});

// Phase 3: Frankie replies PROPOSE — call this endpoint
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
      subject: `Proposal Ready — ${audit.title}`,
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
