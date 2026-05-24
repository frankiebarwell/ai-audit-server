const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, Header
} = require('docx');
const fs = require('fs');

const NAVY       = '1A2744';
const GOLD       = 'C8A951';
const LIGHT_GOLD = 'FDF6E3';
const LIGHT_GREY = 'F5F5F5';
const STEP_TEXT  = '111111';
const NOTE_TEXT  = '555555';

const noBorder  = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const thinBorder  = { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' };
const thinBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

// Content width: 12240 - 2*1080 = 10080 DXA (0.75" margins each side)
const CONTENT = 10080;
const NUM_W   = 480;
const TEXT_W  = CONTENT - NUM_W; // 9600

function spacer(pts = 80) {
  return new Paragraph({ spacing: { before: 0, after: pts }, children: [new TextRun('')] });
}

function sectionHeader(label) {
  return new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: [CONTENT],
    rows: [new TableRow({
      children: [new TableCell({
        borders: thinBorders,
        width: { size: CONTENT, type: WidthType.DXA },
        shading: { fill: NAVY, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 200, right: 200 },
        children: [new Paragraph({
          children: [new TextRun({ text: label, font: 'Arial', size: 19, bold: true, color: GOLD })]
        })]
      })]
    })]
  });
}

function step(num, action, note) {
  return new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: [NUM_W, TEXT_W],
    rows: [new TableRow({
      children: [
        new TableCell({
          borders: thinBorders,
          width: { size: NUM_W, type: WidthType.DXA },
          shading: { fill: NAVY, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 80, right: 80 },
          verticalAlign: 'center',
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: String(num), font: 'Arial', size: 20, bold: true, color: GOLD })]
          })]
        }),
        new TableCell({
          borders: thinBorders,
          width: { size: TEXT_W, type: WidthType.DXA },
          shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 160, right: 160 },
          children: [
            new Paragraph({
              spacing: { before: 0, after: note ? 40 : 0 },
              children: [new TextRun({ text: action, font: 'Arial', size: 19, bold: false, color: STEP_TEXT })]
            }),
            ...(note ? [new Paragraph({
              children: [new TextRun({ text: note, font: 'Arial', size: 17, color: NOTE_TEXT, italics: true })]
            })] : [])
          ]
        })
      ]
    })]
  });
}

function gap() { return spacer(60); }

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 19 } } }
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
      }
    },
    headers: {
      default: new Header({
        children: [
          new Table({
            width: { size: CONTENT, type: WidthType.DXA },
            columnWidths: [6000, 4080],
            rows: [new TableRow({
              children: [
                new TableCell({
                  borders: noBorders,
                  width: { size: 6000, type: WidthType.DXA },
                  children: [new Paragraph({
                    children: [
                      new TextRun({ text: 'AI Readiness Audit', font: 'Arial', size: 28, bold: true, color: NAVY }),
                      new TextRun({ text: '  —  Run Sheet', font: 'Arial', size: 22, color: '888888' })
                    ]
                  })]
                }),
                new TableCell({
                  borders: noBorders,
                  width: { size: 4080, type: WidthType.DXA },
                  children: [new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: 'option10.com', font: 'Arial', size: 18, color: 'AAAAAA' })]
                  })]
                })
              ]
            })]
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

      spacer(160),

      // ── BEFORE THE CALL ────────────────────────────────────────────────────

      sectionHeader('BEFORE THE CALL'),
      gap(),
      step(1,  'Get from the prospect: full name, company name, industry, and email address'),
      gap(),
      step(2,  'Open the web form:  https://ai-audit-server-production-b423.up.railway.app'),
      gap(),
      step(3,  'Fill in all four fields and click Send Questionnaire',
               'The system generates a tailored questionnaire and emails it to the client. Takes ~30 seconds.'),
      gap(),
      step(4,  'Schedule the Zoom call — 30 minutes, at least 48 hrs after sending the questionnaire'),
      gap(),
      step(5,  'Ask the client to return the completed questionnaire to frankie@option10.com before the call',
               'If they don\'t return it, proceed anyway — the system works from the transcript alone.'),

      spacer(120),

      // ── DAY OF CALL — BEFORE ───────────────────────────────────────────────

      sectionHeader('DAY OF CALL — BEFORE THE SESSION  (15–30 mins beforehand)'),
      gap(),
      step(6,  'Open the scheduled Zoom meeting → copy the full join link',
               'Looks like: https://zoom.us/j/XXXXXXXXXX — find it in your calendar invite or the Zoom app.'),
      gap(),
      step(7,  'Go to app.fireflies.ai → click Capture (or Add to Meeting)'),
      gap(),
      step(8,  'Paste the Zoom join link into the Capture box → submit'),
      gap(),
      step(9,  'Confirm AskFred is scheduled — it appears in the Fireflies dashboard and you\'ll get a confirmation email',
               'Tip: connect your calendar to Fireflies once and it auto-joins every Zoom — skipping steps 6–9 permanently.'),

      spacer(120),

      // ── THE CALL ──────────────────────────────────────────────────────────

      sectionHeader('THE CALL'),
      gap(),
      step(10, 'Start the Zoom call — confirm AskFred appears in the participant list within ~1 minute',
               'If AskFred doesn\'t appear, return to Fireflies and use Capture to add it manually.'),
      gap(),
      step(11, 'Run the 30-minute audit — cover tools, processes, time wasters, goals, and team'),
      gap(),
      step(12, 'Close: "I\'ll have your analysis and proposal ready within 24 hours — I\'ll be in touch to walk you through it"'),
      gap(),
      step(13, 'End the call — Fireflies processes the recording in the background'),

      spacer(120),

      // ── AFTER THE CALL ────────────────────────────────────────────────────

      sectionHeader('AFTER THE CALL'),
      gap(),
      step(14, 'Wait ~10–20 minutes → email arrives: "AI Audit for [Client] is Ready"'),
      gap(),
      step(15, 'Click Generate Consultant Briefing in that email'),
      gap(),
      step(16, 'Wait ~60 seconds → email arrives: "AI Analysis for [Client] is Ready" → read it carefully',
               'Pay particular attention to Section 7: Consultant Notes — buying signals and red flags.'),
      gap(),
      step(17, 'Click Generate Client Proposal at the bottom of the analysis email'),
      gap(),
      step(18, 'Wait ~60 seconds → email arrives: "AI Proposal for [Client] is Ready"'),
      gap(),
      step(19, 'Review and edit the proposal — confirm pricing, personalise any figures that feel generic'),
      gap(),
      step(20, 'Send the proposal to the client from your own email (do not forward the system email)'),
      gap(),
      step(21, 'Follow up within 24 hours to book the proposal walkthrough call',
               'The $497 audit fee is credited against Month 1 if the client proceeds within 14 days.'),

      spacer(160),

      // ── Quick ref strip ───────────────────────────────────────────────────

      new Table({
        width: { size: CONTENT, type: WidthType.DXA },
        columnWidths: [CONTENT],
        rows: [new TableRow({
          children: [new TableCell({
            borders: thinBorders,
            width: { size: CONTENT, type: WidthType.DXA },
            shading: { fill: LIGHT_GOLD, type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 200, right: 200 },
            children: [new Paragraph({
              children: [
                new TextRun({ text: 'Web form: ', font: 'Arial', size: 18, bold: true, color: NAVY }),
                new TextRun({ text: 'https://ai-audit-server-production-b423.up.railway.app  ', font: 'Arial', size: 18, color: '333333' }),
                new TextRun({ text: '  |  Fireflies: ', font: 'Arial', size: 18, bold: true, color: NAVY }),
                new TextRun({ text: 'app.fireflies.ai  ', font: 'Arial', size: 18, color: '333333' }),
                new TextRun({ text: '  |  Questionnaire return: ', font: 'Arial', size: 18, bold: true, color: NAVY }),
                new TextRun({ text: 'frankie@option10.com', font: 'Arial', size: 18, color: '333333' }),
              ]
            })]
          })]
        })]
      })

    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/Users/frankiebarwell/CLAUDE CODE/ai-audit-server/AI-Audit-Run-Sheet.docx', buffer);
  console.log('Done: AI-Audit-Run-Sheet.docx');
});
