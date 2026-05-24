const {
  Document, Packer, Paragraph, TextRun, BorderStyle
} = require('docx');
const fs = require('fs');

const NAVY = '1A2744';
const GOLD = 'C8A951';

function para(runs, spacingAfter = 160) {
  const children = typeof runs === 'string'
    ? [new TextRun({ text: runs, font: 'Arial', size: 22, color: '111111' })]
    : runs;
  return new Paragraph({ spacing: { before: 0, after: spacingAfter }, children });
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
        children: [new TextRun({ text: 'Christy Issler  |  Charis Realty', font: 'Arial', size: 22, bold: true, color: NAVY })]
      }),
      spacer(),

      new Paragraph({
        spacing: { before: 0, after: 80 },
        children: [
          new TextRun({ text: 'Subject:  ', font: 'Arial', size: 22, bold: true, color: NAVY }),
          new TextRun({ text: 'Something I think you\'d find genuinely useful, Christy', font: 'Arial', size: 22, color: '111111' })
        ]
      }),
      spacer(),

      para('Hi Christy,'),
      para('How are you? I hope you and the Charis gang are doing well, it was nice to see you when I popped in recently.'),
      para('As I may have mentioned, I\'ve been working crazily in the world of AI over the past four years, specifically helping business owners identify where AI can genuinely save time and money, versus where it\'s just a glorified Google search.'),
      para('I\'ve developed my own structured AI Readiness Audit that I run with business owners one-on-one. It takes about 30 minutes on Zoom (after a tailored, in-depth questionnaire has been completed) and produces a clear written analysis of where AI could make a real difference, covering things like lead follow-up, client communication, listings admin, onboarding, and more. I\'d love to offer you a complimentary session, no strings attached, just a useful conversation and something concrete to take away. This also helps me tweak and refine my system.'),
      para('With your growing agent team, I also think there\'s something valuable in this for the agents directly. I\'d love to run a group audit presentation where I could walk agents through the same questions as a live one-on-one assessment. Everyone would leave with a clear picture of where AI could strengthen their own business. Again, I would offer this free to Charis, as you\'re still in my heart ❤'),
      para('If either of those sounds interesting, or both, I\'d love to find a time to talk it through. Happy to work around your schedule.'),
      para('Let me know.'),
      spacer(),
      para('BTW, Dianne and I are currently at Caesar\'s Palace in Las Vegas. My youngest daughter, Meg, is getting married here tomorrow. All the girls are here from England. It\'s crazy!'),
      spacer(),
      para('Lots of love,'),
      para('Frankie'),

    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/Users/frankiebarwell/AI AUDIT SYSTEM/Outreach-Christy-Issler.docx', buffer);
  console.log('Done: Outreach-Christy-Issler.docx');
});
