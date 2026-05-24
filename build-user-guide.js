const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, Header, Footer,
  PageNumber, LevelFormat
} = require('docx');
const fs = require('fs');

const NAVY     = '1A2744';
const GOLD     = 'C8A951';
const LIGHT_GOLD = 'F5EDD6';
const LIGHT_GREY = 'F7F7F7';

const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

function divider() {
  return new Paragraph({
    spacing: { before: 280, after: 280 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GOLD } },
    children: []
  });
}

function sectionTitle(text) {
  return new Paragraph({
    spacing: { before: 400, after: 160 },
    children: [new TextRun({ text, font: 'Arial', size: 28, bold: true, color: NAVY })]
  });
}

function subTitle(text) {
  return new Paragraph({
    spacing: { before: 240, after: 100 },
    children: [new TextRun({ text, font: 'Arial', size: 22, bold: true, color: NAVY })]
  });
}

function body(text) {
  return new Paragraph({
    spacing: { before: 0, after: 140 },
    children: [new TextRun({ text, font: 'Arial', size: 22, color: '333333' })]
  });
}

function note(text) {
  return new Paragraph({
    spacing: { before: 0, after: 140 },
    children: [new TextRun({ text, font: 'Arial', size: 20, italics: true, color: '666666' })]
  });
}

function step(number, title, detail) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [560, 8800],
    borders: noBorders,
    rows: [new TableRow({
      children: [
        new TableCell({
          borders: noBorders,
          width: { size: 560, type: WidthType.DXA },
          margins: { top: 60, bottom: 60, left: 0, right: 120 },
          shading: { fill: NAVY, type: ShadingType.CLEAR },
          verticalAlign: 'center',
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: String(number), font: 'Arial', size: 22, bold: true, color: 'C8A951' })]
          })]
        }),
        new TableCell({
          borders: noBorders,
          width: { size: 8800, type: WidthType.DXA },
          margins: { top: 60, bottom: 60, left: 160, right: 0 },
          children: [
            new Paragraph({
              spacing: { before: 0, after: detail ? 60 : 0 },
              children: [new TextRun({ text: title, font: 'Arial', size: 22, bold: true, color: '222222' })]
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

function spacer(pts = 120) {
  return new Paragraph({ spacing: { before: 0, after: pts }, children: [new TextRun('')] });
}

function highlightBox(label, value) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 6960],
    rows: [new TableRow({
      children: [
        new TableCell({
          borders: cellBorders,
          width: { size: 2400, type: WidthType.DXA },
          shading: { fill: NAVY, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({
            children: [new TextRun({ text: label, font: 'Arial', size: 20, bold: true, color: 'C8A951' })]
          })]
        }),
        new TableCell({
          borders: cellBorders,
          width: { size: 6960, type: WidthType.DXA },
          shading: { fill: LIGHT_GREY, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({
            children: [new TextRun({ text: value, font: 'Arial', size: 20, color: '333333' })]
          })]
        })
      ]
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
            columnWidths: [5000, 4360],
            borders: noBorders,
            rows: [new TableRow({
              children: [
                new TableCell({
                  borders: noBorders,
                  width: { size: 5000, type: WidthType.DXA },
                  margins: { top: 0, bottom: 0, left: 0, right: 0 },
                  children: [new Paragraph({
                    children: [new TextRun({ text: 'Option 10 — AI Readiness Audit System', font: 'Arial', size: 18, bold: true, color: NAVY })]
                  })]
                }),
                new TableCell({
                  borders: noBorders,
                  width: { size: 4360, type: WidthType.DXA },
                  margins: { top: 0, bottom: 0, left: 0, right: 0 },
                  children: [new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: 'User Guide', font: 'Arial', size: 18, color: '888888' })]
                  })]
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
        children: [
          new Paragraph({
            spacing: { before: 80, after: 0 },
            border: { top: { style: BorderStyle.SINGLE, size: 2, color: 'DDDDDD' } },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Option 10 AI Audit System  |  Confidential  |  Page ', font: 'Arial', size: 16, color: '999999' }),
              new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: '999999' })
            ]
          })
        ]
      })
    },
    children: [

      // ── Title page ─────────────────────────────────────────────────────────

      new Paragraph({
        spacing: { before: 480, after: 120 },
        children: [new TextRun({ text: 'AI Readiness Audit System', font: 'Arial', size: 52, bold: true, color: NAVY })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 60 },
        children: [new TextRun({ text: 'Step-by-Step User Guide', font: 'Arial', size: 30, color: GOLD })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 400 },
        children: [new TextRun({ text: 'Option 10', font: 'Arial', size: 22, color: '888888' })]
      }),
      divider(),

      // ── System overview ────────────────────────────────────────────────────

      sectionTitle('How the System Works'),
      body('The AI Readiness Audit system takes a client from initial contact through to a completed consultant briefing and client proposal — mostly automatically. Your role is to fill in the form before the session, conduct the Zoom call, and click two buttons in the emails that follow.'),
      spacer(160),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1560, 7800],
        rows: [
          ['1. Web Form', 'You enter client details and the questionnaire is emailed to them automatically.'],
          ['2. Zoom Session', 'You conduct the 30-minute audit with Fireflies recording.'],
          ['3. Transcript Ready', 'Fireflies sends the recording to the server. You receive an email.'],
          ['4. Analysis', 'You click one button. Claude produces your internal consultant briefing.'],
          ['5. Proposal', 'You click one button. Claude writes the client-facing proposal.'],
        ].map(([label, detail]) => new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              width: { size: 1560, type: WidthType.DXA },
              shading: { fill: NAVY, type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 160, right: 160 },
              children: [new Paragraph({ children: [new TextRun({ text: label, font: 'Arial', size: 20, bold: true, color: 'C8A951' })] })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 7800, type: WidthType.DXA },
              shading: { fill: LIGHT_GREY, type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 160, right: 160 },
              children: [new Paragraph({ children: [new TextRun({ text: detail, font: 'Arial', size: 20, color: '333333' })] })]
            })
          ]
        }))
      }),

      divider(),

      // ── System URLs ────────────────────────────────────────────────────────

      sectionTitle('System URLs and Access'),
      highlightBox('Web Form', 'https://ai-audit-server-production-b423.up.railway.app'),
      spacer(80),
      highlightBox('Railway Dashboard', 'https://railway.app — project: ai-audit-server'),
      spacer(80),
      highlightBox('GitHub Repo', 'https://github.com/frankiebarwell/ai-audit-server'),
      spacer(80),
      highlightBox('Notify Email', 'frankie@option10.com'),

      divider(),

      // ── Phase 1 ────────────────────────────────────────────────────────────

      sectionTitle('Phase 1 — Before the Session'),
      body('Complete this phase at least 24 hours before the scheduled Zoom call so the client has time to return the questionnaire.'),
      spacer(120),

      step(1, 'Open the web form', 'https://ai-audit-server-production-b423.up.railway.app'),
      spacer(100),
      step(2, 'Fill in the four fields', 'Client Name, Company / Business Name, Industry, and Client Email.'),
      spacer(100),
      step(3, 'Click Send Questionnaire', 'The system generates a tailored questionnaire using Claude and emails it directly to the client. This takes approximately 30 seconds.'),
      spacer(100),
      step(4, 'Check your inbox', 'You will receive a confirmation email once the questionnaire has been sent to the client.'),
      spacer(100),
      step(5, 'Follow up with the client', 'Ask them to complete and return the questionnaire to frankie@option10.com at least 24 hours before the session.'),
      spacer(160),
      note('The system is now primed. Client details are stored and will be automatically applied when the Zoom session recording is processed.'),

      divider(),

      // ── Phase 2 ────────────────────────────────────────────────────────────

      sectionTitle('Phase 2 — The Zoom Session'),
      spacer(80),

      step(1, 'Create your Zoom meeting', 'Set up the meeting in Zoom as normal. No special naming is required.'),
      spacer(100),
      step(2, 'Invite Fireflies to the call', 'Either add fred@fireflies.ai as a participant, or use the Capture box in your Fireflies dashboard and paste in the Zoom meeting link before the call starts.'),
      spacer(100),
      step(3, 'Conduct the 30-minute AI Readiness Audit', 'Run through your audit questions. Fireflies records and transcribes the session automatically.'),
      spacer(100),
      step(4, 'End the Zoom call', 'Fireflies will process the recording in the background. This typically takes 10 to 20 minutes after the call ends.'),
      spacer(160),
      note('Optional: Connect your Google or Outlook calendar to Fireflies so it auto-joins all scheduled meetings — no manual invite needed.'),

      divider(),

      // ── Phase 3 ────────────────────────────────────────────────────────────

      sectionTitle('Phase 3 — Transcript Ready'),
      body('This phase happens automatically. No action required from you until the email arrives.'),
      spacer(120),

      step(1, 'Fireflies sends the webhook', 'When the transcript is ready, Fireflies notifies the server automatically.'),
      spacer(100),
      step(2, 'You receive an email', 'Subject: "AI Audit for [Client Name] is Ready". This contains the transcript word count, client details, and a button to generate the analysis.'),
      spacer(100),
      step(3, 'Review the email', 'Confirm the client details are correct. When you are ready to proceed, move to Phase 4.'),

      divider(),

      // ── Phase 4 ────────────────────────────────────────────────────────────

      sectionTitle('Phase 4 — Generate the Consultant Briefing'),
      spacer(80),

      step(1, 'Click Generate Consultant Briefing', 'The button is in the Phase 3 email. Clicking it opens a confirmation page in your browser and starts the analysis.'),
      spacer(100),
      step(2, 'Wait approximately 60 seconds', 'Claude analyses the full transcript and produces a 7-section internal briefing.'),
      spacer(100),
      step(3, 'Read the analysis email', 'Subject: "AI Analysis for [Client Name] is Ready". This contains the full consultant briefing including readiness score, pain points, automation opportunities, and your private consultant notes.'),
      spacer(100),
      step(4, 'Review before proceeding', 'Read the briefing carefully. Use it to inform your proposal and the walkthrough call. When ready, move to Phase 5.'),
      spacer(160),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({
          children: [new TableCell({
            borders: cellBorders,
            width: { size: 9360, type: WidthType.DXA },
            shading: { fill: LIGHT_GOLD, type: ShadingType.CLEAR },
            margins: { top: 140, bottom: 140, left: 200, right: 200 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 80 },
                children: [new TextRun({ text: 'Analysis sections included:', font: 'Arial', size: 20, bold: true, color: NAVY })]
              }),
              ...['1. Meeting Overview', '2. Current State Assessment', '3. Pain Points and Priorities',
                  '4. AI Readiness Score (out of 30)', '5. Top Automation Opportunities',
                  '6. Quick Wins', '7. Consultant Notes (private)'].map(s =>
                new Paragraph({
                  numbering: { reference: 'bullets', level: 0 },
                  spacing: { before: 0, after: 60 },
                  children: [new TextRun({ text: s, font: 'Arial', size: 20, color: '444444' })]
                })
              )
            ]
          })]
        })]
      }),

      divider(),

      // ── Phase 5 ────────────────────────────────────────────────────────────

      sectionTitle('Phase 5 — Generate the Client Proposal'),
      spacer(80),

      step(1, 'Click Generate Client Proposal', 'The button is at the bottom of the Phase 4 analysis email.'),
      spacer(100),
      step(2, 'Wait approximately 60 seconds', 'Claude writes a full client-facing proposal based on the internal analysis.'),
      spacer(100),
      step(3, 'Receive the proposal email', 'Subject: "AI Proposal for [Client Name] is Ready". Contains the complete draft proposal.'),
      spacer(100),
      step(4, 'Review and edit', 'The proposal is a strong first draft. Review it, personalise any figures or specifics, and send to the client when ready.'),
      spacer(100),
      step(5, 'Book the walkthrough call', 'The proposal closes with an invitation to book a 45-minute proposal walkthrough call. Follow up directly with the client to schedule this.'),

      divider(),

      // ── Credentials ────────────────────────────────────────────────────────

      sectionTitle('Updating Credentials and API Keys'),
      body('All sensitive credentials are stored as environment variables in Railway — never in the code.'),
      spacer(120),

      subTitle('To update any credential:'),
      step(1, 'Go to railway.app', 'Log in and open the ai-audit-server project.'),
      spacer(80),
      step(2, 'Click the service, then the Variables tab', 'All environment variables are listed here.'),
      spacer(80),
      step(3, 'Click the variable, update the value, and save', 'Railway redeploys automatically with the new value.'),
      spacer(160),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2800, 6560],
        rows: [
          ['Variable', 'What it controls'],
          ['ANTHROPIC_API_KEY', 'Claude AI — analysis and proposal generation'],
          ['FIREFLIES_API_KEY', 'Fireflies — transcript fetching'],
          ['GMAIL_USER', 'Gmail account used to send emails'],
          ['GMAIL_APP_PASSWORD', 'Gmail App Password (not your Google login password)'],
          ['NOTIFY_EMAIL', 'Email address that receives all system notifications'],
        ].map(([v, d], i) => new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              width: { size: 2800, type: WidthType.DXA },
              shading: { fill: i === 0 ? NAVY : LIGHT_GREY, type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 160, right: 160 },
              children: [new Paragraph({ children: [new TextRun({ text: v, font: 'Arial', size: i === 0 ? 19 : 18, bold: i === 0, color: i === 0 ? 'C8A951' : '333333' })] })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 6560, type: WidthType.DXA },
              shading: { fill: i === 0 ? NAVY : 'FFFFFF', type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 160, right: 160 },
              children: [new Paragraph({ children: [new TextRun({ text: d, font: 'Arial', size: i === 0 ? 19 : 20, bold: i === 0, color: i === 0 ? 'C8A951' : '444444' })] })]
            })
          ]
        }))
      }),

      divider(),

      // ── Troubleshooting ────────────────────────────────────────────────────

      sectionTitle('Troubleshooting'),
      spacer(80),

      subTitle('No email after submitting the web form'),
      body('Check your spam folder. Confirm GMAIL_USER and GMAIL_APP_PASSWORD are correct in Railway. Gmail App Passwords must be generated from Google Account → Security → 2-Step Verification → App Passwords.'),
      spacer(120),

      subTitle('No webhook notification after the Zoom call'),
      body('Confirm Fireflies was present in the meeting and has processed the recording (check the Fireflies dashboard). Confirm Configuration 4 in Fireflies is enabled and pointing to the correct webhook URL. The system only acts if the web form was submitted before the session.'),
      spacer(120),

      subTitle('Analysis or proposal email does not arrive'),
      body('Check the Railway logs for errors: railway.app → ai-audit-server → Deployments → View Logs. Common causes are an expired Anthropic API key or a Gmail authentication failure.'),
      spacer(120),

      subTitle('Clicked the button but nothing happened'),
      body('The button opens a browser page that confirms processing has started. The email arrives approximately 60 seconds later. If it does not arrive, check Railway logs.'),

      divider(),

      // ── Closing ────────────────────────────────────────────────────────────

      spacer(200),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Option 10 AI Audit System  |  frankie@option10.com  |  Confidential', font: 'Arial', size: 18, color: '999999' })]
      })

    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/Users/frankiebarwell/CLAUDE CODE/ai-audit-server/AI-Audit-System-User-Guide.docx', buffer);
  console.log('Done: AI-Audit-System-User-Guide.docx');
});
