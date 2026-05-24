const {
  Document, Packer, Paragraph, TextRun, BorderStyle
} = require('docx');
const fs = require('fs');

const NAVY = '1A2744';
const GOLD = 'C8A951';

function para(text, spacingAfter = 160) {
  return new Paragraph({
    spacing: { before: 0, after: spacingAfter },
    children: [new TextRun({ text, font: 'Arial', size: 22, color: '111111' })]
  });
}

function spacer() {
  return new Paragraph({ spacing: { before: 0, after: 160 }, children: [new TextRun('')] });
}

const doc = new Document({
  styles: { default: { document: { run: { font: 'Arial', size: 22 } } } },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [

      new Paragraph({
        spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: 'OUTREACH EMAIL', font: 'Arial', size: 18, bold: true, color: GOLD })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 40 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY } },
        children: [new TextRun({ text: 'Rick Weldon  |  Frederick Chamber of Commerce', font: 'Arial', size: 22, bold: true, color: NAVY })]
      }),
      spacer(),

      new Paragraph({
        spacing: { before: 0, after: 80 },
        children: [
          new TextRun({ text: 'Subject:  ', font: 'Arial', size: 22, bold: true, color: NAVY }),
          new TextRun({ text: 'A presentation idea for Chamber members', font: 'Arial', size: 22, color: '111111' })
        ]
      }),
      spacer(),

      para('Hi Rick,'),
      para('How are you? Hope all is well at the Chamber and that 2026 is treating you well so far.'),
      para('As you may know, I\'ve been deep in the world of AI for the past four years, specifically helping business owners figure out where it can genuinely save time and money, versus where it\'s just noise. I\'ve developed my own AI Readiness Audit that I run with business owners one-on-one.'),
      para('I\'d love to bring a version of this to the Chamber as a member presentation. The idea is simple: I walk the room through the audit questions as a guided, live self-assessment. It works across any industry or business type, so it\'s a great fit for a mixed audience. Everyone leaves with a clear picture of where AI could actually help their business, and you get to offer members something genuinely useful and current.'),
      para('Given that I\'ve run workshops at the Chamber before, I know the setup works well and I\'d love to do it again.'),
      para('If you think this could work as a member event, lunch and learn, or even a standalone workshop, I\'d love to talk it through. Happy to work around whatever format suits the Chamber best.'),
      para('Let me know.'),
      spacer(),
      para('All the best,'),
      para('Frankie'),

    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/Users/frankiebarwell/AI AUDIT SYSTEM/Outreach-Rick-Weldon-Chamber.docx', buffer);
  console.log('Done: Outreach-Rick-Weldon-Chamber.docx');
});
