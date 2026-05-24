const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, Header, Footer,
  PageNumber, LevelFormat
} = require('docx');
const fs = require('fs');

const NAVY      = '1A2744';
const GOLD      = 'C8A951';
const LIGHT_GOLD = 'F5EDD6';
const LIGHT_GREY = 'F4F4F4';

const noBorder  = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const cellBorder  = { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

function spacer(pts = 120) {
  return new Paragraph({ spacing: { before: 0, after: pts }, children: [new TextRun('')] });
}

function divider() {
  return new Paragraph({
    spacing: { before: 320, after: 320 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GOLD } },
    children: []
  });
}

function phaseHeader(number, title, subtitle) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({
      children: [new TableCell({
        borders: cellBorders,
        width: { size: 9360, type: WidthType.DXA },
        shading: { fill: NAVY, type: ShadingType.CLEAR },
        margins: { top: 180, bottom: 180, left: 240, right: 240 },
        children: [
          new Paragraph({
            spacing: { before: 0, after: 60 },
            children: [
              new TextRun({ text: `PHASE ${number}  `, font: 'Arial', size: 18, bold: true, color: GOLD }),
              new TextRun({ text: `— ${title.toUpperCase()}`, font: 'Arial', size: 18, bold: true, color: 'a0aec0' })
            ]
          }),
          new Paragraph({
            children: [new TextRun({ text: subtitle, font: 'Arial', size: 24, bold: true, color: 'FFFFFF' })]
          })
        ]
      })]
    })]
  });
}

function sectionTitle(text) {
  return new Paragraph({
    spacing: { before: 360, after: 140 },
    children: [new TextRun({ text, font: 'Arial', size: 26, bold: true, color: NAVY })]
  });
}

function body(text) {
  return new Paragraph({
    spacing: { before: 0, after: 160 },
    children: [new TextRun({ text, font: 'Arial', size: 22, color: '333333' })]
  });
}

function tip(text) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [480, 8880],
    rows: [new TableRow({
      children: [
        new TableCell({
          borders: noBorders,
          width: { size: 480, type: WidthType.DXA },
          shading: { fill: GOLD, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'TIP', font: 'Arial', size: 16, bold: true, color: NAVY })]
          })]
        }),
        new TableCell({
          borders: noBorders,
          width: { size: 8880, type: WidthType.DXA },
          shading: { fill: LIGHT_GOLD, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          children: [new Paragraph({
            children: [new TextRun({ text, font: 'Arial', size: 20, color: '444444' })]
          })]
        })
      ]
    })]
  });
}

function step(number, action, detail) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [520, 8840],
    borders: noBorders,
    rows: [new TableRow({
      children: [
        new TableCell({
          borders: noBorders,
          width: { size: 520, type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 0, right: 120 },
          shading: { fill: NAVY, type: ShadingType.CLEAR },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: String(number), font: 'Arial', size: 22, bold: true, color: GOLD })]
          })]
        }),
        new TableCell({
          borders: noBorders,
          width: { size: 8840, type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 160, right: 0 },
          children: [
            new Paragraph({
              spacing: { before: 0, after: detail ? 60 : 0 },
              children: [new TextRun({ text: action, font: 'Arial', size: 22, bold: true, color: '111111' })]
            }),
            ...(detail ? [new Paragraph({
              spacing: { before: 0, after: 0 },
              children: [new TextRun({ text: detail, font: 'Arial', size: 20, color: '555555' })]
            })] : [])
          ]
        })
      ]
    })]
  });
}

function infoRow(label, value) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2200, 7160],
    rows: [new TableRow({
      children: [
        new TableCell({
          borders: cellBorders,
          width: { size: 2200, type: WidthType.DXA },
          shading: { fill: LIGHT_GREY, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({ children: [new TextRun({ text: label, font: 'Arial', size: 20, bold: true, color: NAVY })] })]
        }),
        new TableCell({
          borders: cellBorders,
          width: { size: 7160, type: WidthType.DXA },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({ children: [new TextRun({ text: value, font: 'Arial', size: 20, color: '333333' })] })]
        })
      ]
    })]
  });
}

function scriptBox(label, text) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({
      children: [new TableCell({
        borders: cellBorders,
        width: { size: 9360, type: WidthType.DXA },
        shading: { fill: LIGHT_GREY, type: ShadingType.CLEAR },
        margins: { top: 160, bottom: 160, left: 240, right: 240 },
        children: [
          new Paragraph({
            spacing: { before: 0, after: 100 },
            children: [new TextRun({ text: label, font: 'Arial', size: 19, bold: true, color: NAVY })]
          }),
          new Paragraph({
            children: [new TextRun({ text, font: 'Arial', size: 20, italics: true, color: '444444' })]
          })
        ]
      })]
    })]
  });
}

const doc = new Document({
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 480, hanging: 240 } } } }]
    }]
  },
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } }
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [5400, 3960],
            borders: noBorders,
            rows: [new TableRow({
              children: [
                new TableCell({
                  borders: noBorders, width: { size: 5400, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Option 10 — AI Readiness Audit', font: 'Arial', size: 18, bold: true, color: NAVY })] })]
                }),
                new TableCell({
                  borders: noBorders, width: { size: 3960, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Full Process Guide', font: 'Arial', size: 18, color: '888888' })] })]
                })
              ]
            })]
          }),
          new Paragraph({
            spacing: { before: 80, after: 0 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY } },
            children: []
          })
        ]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          spacing: { before: 80, after: 0 },
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: 'DDDDDD' } },
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: 'Option 10 AI Audit System  |  Confidential  |  Page ', font: 'Arial', size: 16, color: '999999' }),
            new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: '999999' })
          ]
        })]
      })
    },

    children: [

      // ── Cover ───────────────────────────────────────────────────────────────

      new Paragraph({
        spacing: { before: 480, after: 120 },
        children: [new TextRun({ text: 'AI Readiness Audit', font: 'Arial', size: 52, bold: true, color: NAVY })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 60 },
        children: [new TextRun({ text: 'Full Process Guide', font: 'Arial', size: 30, color: GOLD })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: 'From first contact to delivered proposal', font: 'Arial', size: 22, color: '888888' })]
      }),
      divider(),
      body('This guide walks you through the complete AI Readiness Audit process — from identifying a prospect and capturing their details, through to delivering the finished proposal. Follow these steps in sequence for every client.'),
      spacer(80),

      // Overview table
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1400, 7960],
        rows: [
          ['Phase 1', 'Prospect Capture — Get the right details before anything else'],
          ['Phase 2', 'Session Setup — Web form, questionnaire, scheduling'],
          ['Phase 3', 'Fireflies Setup — Get the recording ready before the call'],
          ['Phase 4', 'The Zoom Session — Conducting the 30-minute audit'],
          ['Phase 5', 'Post-Call — Automated transcript processing'],
          ['Phase 6', 'The Analysis — Your internal consultant briefing'],
          ['Phase 7', 'The Proposal — Client-facing document and next steps'],
        ].map(([phase, desc]) => new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              width: { size: 1400, type: WidthType.DXA },
              shading: { fill: NAVY, type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 160, right: 160 },
              children: [new Paragraph({ children: [new TextRun({ text: phase, font: 'Arial', size: 20, bold: true, color: GOLD })] })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 7960, type: WidthType.DXA },
              shading: { fill: LIGHT_GREY, type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 160, right: 160 },
              children: [new Paragraph({ children: [new TextRun({ text: desc, font: 'Arial', size: 20, color: '333333' })] })]
            })
          ]
        }))
      }),

      divider(),

      // ── Phase 1 ─────────────────────────────────────────────────────────────

      phaseHeader(1, 'Prospect Capture', 'Get the right details before anything else'),
      spacer(200),

      body('Before you can set up the audit session, you need three pieces of information from the prospect: their name, their business name, and their industry. These are used to generate their personalised questionnaire and to prime the analysis.'),
      spacer(120),

      step(1, 'Identify the prospect', 'This could come from a referral, a LinkedIn connection, a networking event, or an inbound enquiry. The source does not matter — what matters is capturing the three essentials before moving forward.'),
      spacer(100),
      step(2, 'Capture the three essentials',
        'Full name, business name, and industry/type of business. If the industry is not obvious, ask directly — it shapes the tailored questionnaire the system generates.'),
      spacer(100),
      step(3, 'Get their email address', 'The questionnaire is emailed directly to them, so you need their preferred email before setting up the session.'),
      spacer(160),

      scriptBox('Suggested opening line (email or LinkedIn):',
        '"I\'d love to run a complimentary AI Readiness Audit for you and [Business Name] — it\'s a focused 30-minute session where I map out exactly where AI could save you time and increase your profit. I\'ll send you a short questionnaire first so we get straight to the specifics on the call. What\'s the best email to send that to?"'),

      divider(),

      // ── Phase 2 ─────────────────────────────────────────────────────────────

      phaseHeader(2, 'Session Setup', 'Web form, questionnaire, and scheduling'),
      spacer(200),

      body('Once you have the prospect\'s details, open the web form. This is the starting point for the entire system — it generates the questionnaire, emails it to the client, and primes the server ready for the session recording.'),
      spacer(120),

      step(1, 'Open the web form',
        'https://ai-audit-server-production-b423.up.railway.app'),
      spacer(100),
      step(2, 'Fill in all four fields',
        'Client Name, Company / Business Name, Industry, and Client Email. Be specific with industry — "employment law firm" is better than "legal".'),
      spacer(100),
      step(3, 'Click Send Questionnaire',
        'The system generates a tailored 26-question questionnaire via Claude and emails it directly to the client. This takes approximately 30 seconds. You will receive a confirmation email once it has been sent.'),
      spacer(100),
      step(4, 'Schedule the Zoom session',
        'Book the 30-minute call. Send the prospect a calendar invite with the Zoom link. Aim for at least 48 hours after sending the questionnaire so they have time to complete it.'),
      spacer(100),
      step(5, 'Name the Zoom meeting correctly',
        'When creating the Zoom meeting, name it: AI Audit — [Client Full Name] (e.g. AI Audit — Lex Figueroa). This is how the system matches the Fireflies recording to the right client. Without this, their transcript will not be linked to their questionnaire and context. The confirmation page and email remind you of the exact name to use each time.'),
      spacer(100),
      step(6, 'Follow up on the questionnaire',
        'Ask the client to complete and return the questionnaire to frankie@option10.com at least 24 hours before the session. A short reminder the day before the call works well.'),
      spacer(160),

      tip('If the client does not return the questionnaire before the call, proceed anyway. The system will still produce a full analysis and proposal from the transcript alone. The questionnaire simply makes the session sharper.'),

      divider(),

      // ── Phase 3 ─────────────────────────────────────────────────────────────

      phaseHeader(3, 'Fireflies Setup', 'Get the recording ready before the call starts'),
      spacer(200),

      body('Fireflies records and transcribes the Zoom session. You need to tell Fireflies about the meeting before it starts so the bot joins automatically. Do this on the day of the call, ideally 15 to 30 minutes before the session begins.'),
      spacer(120),

      step(1, 'Open your Zoom meeting',
        'Start the Zoom meeting you scheduled, or open the scheduled meeting details to find the Meeting ID and join link.'),
      spacer(100),
      step(2, 'Copy the Zoom join link',
        'This is the full URL — it looks like https://zoom.us/j/XXXXXXXXXX. You can find it in your calendar invite or in the Zoom app under Meetings.'),
      spacer(100),
      step(3, 'Log into Fireflies',
        'Go to app.fireflies.ai and log in.'),
      spacer(100),
      step(4, 'Open the Capture box',
        'In the Fireflies dashboard, look for the Capture or Add to Meeting option. It is usually visible on the main dashboard or under New Capture.'),
      spacer(100),
      step(5, 'Paste the Zoom join link and submit',
        'Paste the full Zoom URL into the Capture box and confirm. Fireflies will schedule its bot (AskFred) to join the meeting automatically when it starts.'),
      spacer(100),
      step(6, 'Confirm the bot is scheduled',
        'Fireflies will show the meeting as scheduled in your dashboard. You will also typically receive a confirmation email from Fireflies.'),
      spacer(160),

      tip('To skip this step entirely, connect your Google Calendar or Outlook to Fireflies. It will auto-join every scheduled Zoom meeting without any manual action — set it once and it handles itself.'),

      spacer(120),

      infoRow('Fireflies login', 'app.fireflies.ai'),
      spacer(80),
      infoRow('Bot name in Zoom', 'AskFred by Fireflies.ai'),
      spacer(80),
      infoRow('Webhook (Configuration 4)', 'https://ai-audit-server-production-b423.up.railway.app/webhook/fireflies'),

      divider(),

      // ── Phase 4 ─────────────────────────────────────────────────────────────

      phaseHeader(4, 'The Zoom Session', 'Conducting the 30-minute audit'),
      spacer(200),

      body('The session is a focused 30-minute conversation. Your goal is to understand the client\'s current operation, where time is being lost, and what they are trying to achieve. Fireflies handles the recording — you focus entirely on the conversation.'),
      spacer(120),

      step(1, 'Start the Zoom call and confirm Fireflies has joined',
        'AskFred should appear in the participant list within the first minute. If it does not appear, return to Fireflies and use the Capture box to add it manually.'),
      spacer(100),
      step(2, 'Open the session',
        'Introduce yourself and frame the call — what you are doing, what they can expect, and what happens afterwards. Keep it brief.'),
      spacer(100),
      step(3, 'Work through your audit questions',
        'Cover their current tools and processes, where time is being wasted, their pain points, team structure, comfort with technology, and their goals. Use the completed questionnaire as context if they returned it.'),
      spacer(100),
      step(4, 'Listen for buying signals and hesitations',
        'These will be captured in your consultant notes section of the analysis. Note them mentally — Claude will surface them in the briefing.'),
      spacer(100),
      step(5, 'Close the session',
        'Let them know the next step: you will review the session and prepare a detailed analysis and proposal, which you will walk them through on a follow-up call.'),
      spacer(100),
      step(6, 'End the Zoom call',
        'Fireflies continues processing in the background. The transcript is typically ready within 10 to 20 minutes of the call ending.'),
      spacer(160),

      scriptBox('Suggested close:',
        '"Thank you — this has been really useful. I\'m going to review everything we\'ve covered and put together a detailed picture of where AI can make the biggest difference for you specifically. I\'ll have a full analysis and a proposal ready within 24 hours, and I\'d love to walk you through it on a short call. I\'ll be in touch."'),

      divider(),

      // ── Phase 5 ─────────────────────────────────────────────────────────────

      phaseHeader(5, 'Post-Call', 'Automated transcript processing'),
      spacer(200),

      body('After the call ends, the system takes over. Nothing is required from you until the notification email arrives in your inbox.'),
      spacer(120),

      step(1, 'Fireflies processes the recording',
        'This typically takes 10 to 20 minutes after the call ends. Fireflies transcribes the full session and sends a webhook notification to the AI Audit server.'),
      spacer(100),
      step(2, 'The server fetches the transcript',
        'The AI Audit server receives the notification, retrieves the transcript, and matches it to the client details you entered in the web form.'),
      spacer(100),
      step(3, 'You receive an email',
        'Subject: "AI Audit for [Client Name] is Ready". This confirms the transcript has been captured and includes a button to generate the consultant briefing.'),
      spacer(160),

      tip('If you do not receive this email within 30 minutes of the call ending, check that Fireflies processed the recording successfully in your Fireflies dashboard, and confirm Configuration 4 is enabled under Fireflies webhook settings.'),

      divider(),

      // ── Phase 6 ─────────────────────────────────────────────────────────────

      phaseHeader(6, 'The Analysis', 'Your internal consultant briefing'),
      spacer(200),

      body('The analysis is your internal working document — a private briefing that tells you everything you need to know about this client before writing the proposal. It is never seen by the client.'),
      spacer(120),

      step(1, 'Click Generate Consultant Briefing',
        'The button is in the Phase 5 notification email. Clicking it opens a brief confirmation page in your browser and triggers the analysis.'),
      spacer(100),
      step(2, 'Wait approximately 60 seconds',
        'Claude analyses the full transcript using your client context and produces the briefing.'),
      spacer(100),
      step(3, 'Read the analysis email carefully',
        'Subject: "AI Analysis for [Client Name] is Ready". Review all seven sections before generating the proposal.'),
      spacer(100),
      step(4, 'Note the Consultant Notes section',
        'This is the most important section for your next steps — it captures buying signals, hesitations, and objections that should shape how you position the proposal.'),
      spacer(160),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({
          children: [new TableCell({
            borders: cellBorders,
            width: { size: 9360, type: WidthType.DXA },
            shading: { fill: LIGHT_GOLD, type: ShadingType.CLEAR },
            margins: { top: 160, bottom: 160, left: 200, right: 200 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 100 },
                children: [new TextRun({ text: 'The seven sections of the analysis:', font: 'Arial', size: 20, bold: true, color: NAVY })]
              }),
              ...['1. Meeting Overview — first honest impression of the client and their business',
                '2. Current State Assessment — tools, processes, and where time is being lost',
                '3. Pain Points and Priorities — direct quotes and urgency ranking',
                '4. AI Readiness Score — rated across 6 dimensions, total out of 30',
                '5. Top Automation Opportunities — 5 to 7 specific opportunities with time savings',
                '6. Quick Wins — 3 things implementable within 30 days',
                '7. Consultant Notes — private read on the client, buying signals, and red flags'
              ].map(s => new Paragraph({
                numbering: { reference: 'bullets', level: 0 },
                spacing: { before: 0, after: 80 },
                children: [new TextRun({ text: s, font: 'Arial', size: 20, color: '444444' })]
              }))
            ]
          })]
        })]
      }),

      divider(),

      // ── Phase 7 ─────────────────────────────────────────────────────────────

      phaseHeader(7, 'The Proposal', 'Client-facing document and next steps'),
      spacer(200),

      body('The proposal is generated directly from the internal analysis. It is a full client-facing document — professional, specific to their situation, and structured to move them towards a decision.'),
      spacer(120),

      step(1, 'Click Generate Client Proposal',
        'The button is at the bottom of the analysis email. Clicking it triggers the proposal generation.'),
      spacer(100),
      step(2, 'Wait approximately 60 seconds',
        'Claude writes the full proposal based on the internal analysis.'),
      spacer(100),
      step(3, 'Receive and review the proposal email',
        'Subject: "AI Proposal for [Client Name] is Ready". Read it carefully — it is a strong first draft but may need light editing for tone, specific figures, or any details you want to adjust.'),
      spacer(100),
      step(4, 'Edit before sending',
        'Personalise any numbers or specifics that feel too generic. Confirm the investment section reflects your current pricing. The proposal is a template — make it yours.'),
      spacer(100),
      step(5, 'Send the proposal to the client',
        'Email it directly from your own email account. Do not forward the system email — copy the text into a clean, branded document or email.'),
      spacer(100),
      step(6, 'Book the proposal walkthrough call',
        'The proposal closes with an invitation to book a 45-minute walkthrough call. Follow up with the client within 24 hours of sending to schedule it. This is where the sale is made.'),
      spacer(160),

      tip('The proposal walkthrough call is more important than the proposal itself. The document creates credibility. The call closes the engagement. Always push for the call within 14 days — that is the window where the $497 audit fee credit applies.'),

      spacer(120),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({
          children: [new TableCell({
            borders: cellBorders,
            width: { size: 9360, type: WidthType.DXA },
            shading: { fill: NAVY, type: ShadingType.CLEAR },
            margins: { top: 180, bottom: 180, left: 240, right: 240 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 100 },
                children: [new TextRun({ text: 'The seven sections of the proposal:', font: 'Arial', size: 20, bold: true, color: GOLD })]
              }),
              ...['1. Executive Summary', '2. Your Situation', '3. What We Will Build',
                '4. What This Means For Your Business', '5. Implementation Roadmap (30/60/90 days)',
                '6. Your Investment', '7. Next Steps'
              ].map(s => new Paragraph({
                numbering: { reference: 'bullets', level: 0 },
                spacing: { before: 0, after: 80 },
                children: [new TextRun({ text: s, font: 'Arial', size: 20, color: 'CCCCCC' })]
              }))
            ]
          })]
        })]
      }),

      divider(),

      // ── Quick reference ──────────────────────────────────────────────────────

      sectionTitle('Quick Reference'),
      spacer(80),
      infoRow('Web Form', 'https://ai-audit-server-production-b423.up.railway.app'),
      spacer(80),
      infoRow('Fireflies Dashboard', 'app.fireflies.ai'),
      spacer(80),
      infoRow('Questionnaire Return Email', 'frankie@option10.com'),
      spacer(80),
      infoRow('Audit Duration', '30 minutes'),
      spacer(80),
      infoRow('Analysis Turnaround', 'Approx. 60 seconds after clicking Generate'),
      spacer(80),
      infoRow('Proposal Turnaround', 'Approx. 60 seconds after clicking Generate'),
      spacer(80),
      infoRow('Audit Fee', '$497 — credited against Month 1 if client proceeds within 14 days'),
      spacer(80),
      infoRow('Engagement Fee', '$5,000/month x 3 months ($15,000 total)'),

      divider(),

      spacer(200),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Option 10  |  frankie@option10.com  |  Confidential', font: 'Arial', size: 18, color: '999999' })]
      })

    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/Users/frankiebarwell/CLAUDE CODE/ai-audit-server/AI-Audit-Full-Process-Guide.docx', buffer);
  console.log('Done: AI-Audit-Full-Process-Guide.docx');
});
