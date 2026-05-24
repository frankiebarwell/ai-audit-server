const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, Header, PageNumber
} = require('docx');
const fs = require('fs');

const NAVY      = '1A2744';
const GOLD      = 'C8A951';
const LIGHT_GOLD = 'FDF6E3';
const LIGHT_GREY = 'F7F8FA';
const BODY_TEXT  = '222222';
const NOTE_TEXT  = '555555';

const CONTENT = 9360; // 8.5" - 2 x 1" margins
const noBorder  = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const thinBorder  = { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' };
const thinBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

function spacer(pts = 120) {
  return new Paragraph({ spacing: { before: 0, after: pts }, children: [new TextRun('')] });
}

function sectionTitle(label, subtitle) {
  return new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: [CONTENT],
    rows: [new TableRow({ children: [new TableCell({
      borders: noBorders,
      shading: { fill: NAVY, type: ShadingType.CLEAR },
      margins: { top: 180, bottom: 180, left: 280, right: 280 },
      children: [
        new Paragraph({ children: [new TextRun({ text: label, font: 'Arial', size: 26, bold: true, color: GOLD })] }),
        ...(subtitle ? [new Paragraph({ spacing: { before: 40, after: 0 }, children: [new TextRun({ text: subtitle, font: 'Arial', size: 18, color: 'a0aec0' })] })] : [])
      ]
    })] })]
  });
}

function stepRow(num, title, detail) {
  return new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: [560, CONTENT - 560],
    rows: [new TableRow({ children: [
      new TableCell({
        borders: thinBorders,
        width: { size: 560, type: WidthType.DXA },
        shading: { fill: GOLD, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 100, right: 100 },
        verticalAlign: 'center',
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: String(num), font: 'Arial', size: 28, bold: true, color: NAVY })]
        })]
      }),
      new TableCell({
        borders: thinBorders,
        width: { size: CONTENT - 560, type: WidthType.DXA },
        shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 200, right: 200 },
        children: [
          new Paragraph({ spacing: { before: 0, after: detail ? 50 : 0 }, children: [new TextRun({ text: title, font: 'Arial', size: 20, bold: true, color: NAVY })] }),
          ...(detail ? [new Paragraph({ children: [new TextRun({ text: detail, font: 'Arial', size: 18, color: NOTE_TEXT })] })] : [])
        ]
      })
    ] })]
  });
}

function calloutBox(text, bgColor = LIGHT_GOLD) {
  return new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: [CONTENT],
    rows: [new TableRow({ children: [new TableCell({
      borders: noBorders,
      shading: { fill: bgColor, type: ShadingType.CLEAR },
      margins: { top: 160, bottom: 160, left: 280, right: 280 },
      children: [new Paragraph({ children: [new TextRun({ text, font: 'Arial', size: 18, color: NOTE_TEXT, italics: true })] })]
    })] })]
  });
}

function bodyPara(text, bold = false) {
  return new Paragraph({
    spacing: { before: 0, after: 140 },
    children: [new TextRun({ text, font: 'Arial', size: 20, color: BODY_TEXT, bold })]
  });
}

function subHeading(text) {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [new TextRun({ text, font: 'Arial', size: 20, bold: true, color: NAVY })]
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { before: 0, after: 80 },
    indent: { left: 360, hanging: 280 },
    children: [
      new TextRun({ text: '•  ', font: 'Arial', size: 20, color: GOLD }),
      new TextRun({ text, font: 'Arial', size: 20, color: BODY_TEXT })
    ]
  });
}

const doc = new Document({
  styles: { default: { document: { run: { font: 'Arial', size: 20 } } } },
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
            width: { size: CONTENT, type: WidthType.DXA },
            columnWidths: [6000, 3360],
            rows: [new TableRow({ children: [
              new TableCell({
                borders: noBorders,
                children: [new Paragraph({ children: [
                  new TextRun({ text: 'Option 10  ', font: 'Arial', size: 22, bold: true, color: NAVY }),
                  new TextRun({ text: 'AI Readiness Audit System', font: 'Arial', size: 18, color: '888888' })
                ]})]
              }),
              new TableCell({
                borders: noBorders,
                children: [new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [new TextRun({ text: 'audit.option10.com', font: 'Arial', size: 16, color: 'AAAAAA' })]
                })]
              })
            ]})]
          }),
          new Paragraph({
            spacing: { before: 60, after: 0 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: GOLD } },
            children: []
          })
        ]
      })
    },

    children: [

      spacer(80),

      // ── TITLE ────────────────────────────────────────────────────────────────
      new Paragraph({
        spacing: { before: 0, after: 60 },
        children: [new TextRun({ text: 'AI Readiness Audit System', font: 'Arial', size: 40, bold: true, color: NAVY })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 0 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GOLD } },
        children: [new TextRun({ text: 'How It Works — Complete Reference Guide', font: 'Arial', size: 22, color: '666666' })]
      }),

      spacer(200),

      // ══════════════════════════════════════════════════════════════════════
      // SECTION C — THE SYSTEM
      // ══════════════════════════════════════════════════════════════════════
      sectionTitle('C.  WHAT THE SYSTEM IS DESIGNED TO DO', 'The big picture'),
      spacer(120),

      bodyPara('The Option 10 AI Readiness Audit is a structured intelligence-gathering and reporting system that lets a consultant assess a business\'s AI readiness, produce a detailed internal briefing, and generate a personalised client proposal — all within 24 hours of a single 30-minute conversation.'),
      bodyPara('It is built around three core stages: preparation, conversation, and automated analysis. Each stage feeds the next. The system handles the administrative and analytical workload so the consultant can focus entirely on the quality of the conversation itself.'),

      spacer(60),
      subHeading('What the system does automatically'),
      bullet('Generates a tailored, industry-specific questionnaire for each prospect using Claude AI'),
      bullet('Emails the questionnaire to the prospect as a formatted Word document with an optional upload link'),
      bullet('Stores all client data in a persistent database, surviving server restarts and redeployments'),
      bullet('Joins the Zoom call automatically via Fireflies and transcribes the full conversation'),
      bullet('Matches the transcript to the correct client record using the meeting name'),
      bullet('Incorporates the prospect\'s written questionnaire answers into the analysis if they uploaded them'),
      bullet('Produces a detailed internal consultant briefing using Claude AI, including a readiness score and buying signal assessment'),
      bullet('Generates a personalised client-facing proposal ready for review and delivery'),
      bullet('Logs every new client submission to a Google Sheet tracker'),

      spacer(60),
      subHeading('What the system does not do'),
      bullet('It does not send the proposal to the client — the consultant reviews and sends it personally'),
      bullet('It does not replace the conversation — the 30-minute Zoom call is the heart of the process'),
      bullet('It does not make decisions — it provides intelligence; the consultant interprets and acts'),

      spacer(60),
      calloutBox('The system is designed so that by the time a prospect receives a proposal, it feels like it was written specifically for them — because it was. The AI works from real answers, a real conversation, and real context. There is no template in sight.'),

      spacer(200),

      // ══════════════════════════════════════════════════════════════════════
      // SECTION A — FRANKIE'S PERSPECTIVE
      // ══════════════════════════════════════════════════════════════════════
      sectionTitle('A.  YOUR PROCESS', 'Step by step, from your perspective'),
      spacer(120),

      subHeading('Before the call'),
      spacer(40),
      stepRow(1, 'Collect the prospect\'s details', 'You need their full name, company name, industry, position within the company, the services they offer, and their email address.'),
      spacer(60),
      stepRow(2, 'Open the web form', 'Go to audit.option10.com?token=option10audit (bookmark this). The Bitly short link — bit.ly/Option10-AI-Audit — can be shared with prospects for self-service.'),
      spacer(60),
      stepRow(3, 'Submit the form', 'Fill in all six fields and click Send Questionnaire. The system generates a tailored questionnaire and emails it to the prospect within about 30 seconds. You\'ll receive a confirmation email.'),
      spacer(60),
      stepRow(4, 'Schedule the Zoom call', 'At least 48 hours after the questionnaire is sent. Name the meeting exactly: AI Audit — [Client Full Name]. This is critical — it\'s how the system matches the recording to the right client.'),
      spacer(60),
      stepRow(5, 'Set up Fireflies on the day', 'Go to app.fireflies.ai, click Capture, paste the Zoom join link, and confirm AskFred is scheduled. It will appear as a participant when the call starts. Tip: connect your calendar to Fireflies once and it joins every Zoom automatically.'),

      spacer(120),
      subHeading('The call'),
      spacer(40),
      stepRow(6, 'Run the 30-minute session', 'Cover tools, processes, time wasters, goals, and team. You\'ll have the questionnaire structure as a guide. Let the conversation breathe — the best insights often come from tangents.'),
      spacer(60),
      stepRow(7, 'Close the call', 'End with: "I\'ll have your analysis and proposal ready within 24 hours." Fireflies processes the recording automatically in the background.'),

      spacer(120),
      subHeading('After the call'),
      spacer(40),
      stepRow(8, 'Wait for the Fireflies email', 'Arrives 10 to 20 minutes after the call ends. Subject: "AI Audit for [Client] is Ready."'),
      spacer(60),
      stepRow(9, 'Click Generate Consultant Briefing', 'This triggers the AI analysis. You\'ll receive the full briefing by email in approximately 60 seconds.'),
      spacer(60),
      stepRow(10, 'Read the briefing carefully', 'Pay particular attention to Section 7 — Consultant Notes. This is where the system flags buying signals, objections, and red flags based on what was said in the call.'),
      spacer(60),
      stepRow(11, 'Click Generate Client Proposal', 'Found at the bottom of the briefing email. The proposal arrives by email in approximately 60 seconds.'),
      spacer(60),
      stepRow(12, 'Review and personalise the proposal', 'Check pricing, adjust any figures that feel generic, and make sure the tone reflects the conversation you had. Then send it from your own email — do not forward the system email.'),
      spacer(60),
      stepRow(13, 'Follow up within 24 hours', 'Book the proposal walkthrough call. The $497 audit fee is credited against Month 1 if the client proceeds within 14 days.'),

      spacer(60),
      calloutBox('If a prospect submitted the form weeks ago and the server has restarted since then, use the re-register page at audit.option10.com/register?token=option10audit to add them back before the Zoom call. Copy their details from the Google Sheet tracker. No email is sent to the client.'),

      spacer(200),

      // ══════════════════════════════════════════════════════════════════════
      // SECTION B — PROSPECT'S PERSPECTIVE
      // ══════════════════════════════════════════════════════════════════════
      sectionTitle('B.  THE PROSPECT\'S EXPERIENCE', 'What they see and do'),
      spacer(120),

      bodyPara('The prospect\'s experience is designed to feel effortless and professional. They are never asked to do anything technically complex, nothing is sent back by email, and they are never made to feel tested or evaluated before the call.'),

      spacer(60),
      subHeading('Step by step'),
      spacer(40),

      stepRow(1, 'They receive the questionnaire by email', 'Subject: "Your AI Readiness Audit — Session Preparation Guide." The email is warm and personal — from Frankie, not a system. The questionnaire arrives as a Word document attachment.'),
      spacer(60),
      stepRow(2, 'They save the Word document', 'The email and the document itself both instruct them to save it to their computer before editing. This is the only technical step they are asked to do.'),
      spacer(60),
      stepRow(3, 'They work through the questions at their own pace', 'Questions are flagged as PRIORITY (must cover on the call) or WORTH COVERING (valuable if time allows). There is a notes space below each question. Bullet points are fine — there are no wrong answers.'),
      spacer(60),
      stepRow(4, 'They optionally upload their completed questionnaire', 'The email contains an "Upload Completed Questionnaire" button. This is entirely optional. If they upload it, their written answers are incorporated into the AI analysis alongside the call transcript, producing a richer result. If they don\'t, the system works from the transcript alone.'),
      spacer(60),
      stepRow(5, 'They join the Zoom call', 'A 30-minute conversation with Frankie. They are encouraged to treat it as a working conversation, not a test. They talk through their tools, processes, frustrations, and goals.'),
      spacer(60),
      stepRow(6, 'They receive the proposal', 'Within 24 hours of the call, Frankie sends them a personalised proposal. It is written in plain language, reflects the specific conversation they had, and outlines the recommended AI implementation approach for their business.'),

      spacer(60),
      calloutBox('The prospect never interacts with the system directly after the questionnaire email. Everything from the Zoom call onwards is invisible to them. From their perspective, Frankie listened carefully and came back quickly with something that felt tailor-made.'),

      spacer(200),

      // ── Quick reference ───────────────────────────────────────────────────
      new Table({
        width: { size: CONTENT, type: WidthType.DXA },
        columnWidths: [CONTENT],
        rows: [new TableRow({ children: [new TableCell({
          borders: thinBorders,
          shading: { fill: NAVY, type: ShadingType.CLEAR },
          margins: { top: 160, bottom: 160, left: 280, right: 280 },
          children: [
            new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: 'QUICK REFERENCE', font: 'Arial', size: 18, bold: true, color: GOLD })] }),
            new Paragraph({ spacing: { before: 0, after: 60 }, children: [
              new TextRun({ text: 'Web form:  ', font: 'Arial', size: 17, bold: true, color: GOLD }),
              new TextRun({ text: 'audit.option10.com?token=option10audit', font: 'Arial', size: 17, color: 'DDDDDD' })
            ]}),
            new Paragraph({ spacing: { before: 0, after: 60 }, children: [
              new TextRun({ text: 'Prospect self-serve:  ', font: 'Arial', size: 17, bold: true, color: GOLD }),
              new TextRun({ text: 'bit.ly/Option10-AI-Audit', font: 'Arial', size: 17, color: 'DDDDDD' })
            ]}),
            new Paragraph({ spacing: { before: 0, after: 60 }, children: [
              new TextRun({ text: 'Re-register page:  ', font: 'Arial', size: 17, bold: true, color: GOLD }),
              new TextRun({ text: 'audit.option10.com/register?token=option10audit', font: 'Arial', size: 17, color: 'DDDDDD' })
            ]}),
            new Paragraph({ spacing: { before: 0, after: 60 }, children: [
              new TextRun({ text: 'Fireflies:  ', font: 'Arial', size: 17, bold: true, color: GOLD }),
              new TextRun({ text: 'app.fireflies.ai', font: 'Arial', size: 17, color: 'DDDDDD' })
            ]}),
            new Paragraph({ spacing: { before: 0, after: 0 }, children: [
              new TextRun({ text: 'Zoom meeting name:  ', font: 'Arial', size: 17, bold: true, color: GOLD }),
              new TextRun({ text: 'AI Audit — [Client Full Name]', font: 'Arial', size: 17, color: 'DDDDDD' })
            ]})
          ]
        })] })]
      })

    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/Users/frankiebarwell/AI AUDIT SYSTEM/AI-Audit-System-Overview.docx', buffer);
  console.log('Done: AI-Audit-System-Overview.docx');
});
