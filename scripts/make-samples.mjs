// Writes the demo-format sample PDFs into samples/. Minimal hand-built PDF (Helvetica, one page each).
import { writeFileSync } from "node:fs";

const docs = {
  "TMI-HOME-v3.pdf": [
    "HOME INSURANCE POLICY WORDING",
    "Wording reference: TMI-HOME-v3",
    "Insurer: Tallowood Mutual Insurance",
    "Product: Tallowood Home Insurance",
    "Effective date: 1 January 2024",
    "",
    "Please read this wording together with your schedule. Words in bold have special meanings.",
    "",
    "Section 3 Excess",
    "3.1 The basic excess is $750 for each claim.",
    "3.3 Only the highest applicable excess is deducted for each event.",
    "Section 4 What we do not cover",
    "4.2 We do not cover:",
    "(a) loss or damage caused by wear and tear;",
    "(b) gradual damage;",
    "(c) loss or damage caused by flood.",
    "Section 5 Limits",
    "5.1 The most we will pay for building damage is the building sum insured shown in your schedule.",
    "5.2 We deduct the excess after applying the limits in clause 5.1.",
    "5.3 We pay up to $3,000 for any one item of jewellery or watches unless it is specified in",
    "your schedule.",
    "5.4 We pay for temporary accommodation up to 10% of the building sum insured, for no more",
    "than 12 months.",
    "Section 6 Making a claim",
    "6.1 Your claim will be referred to a senior assessor before payment if the settlement amount",
    "is more than $250,000.",
    "6.2 If a repair quote or proof of ownership is missing, we will ask you for it before we decide",
    "your claim.",
  ],
  "TMI-END-07.pdf": [
    "ENDORSEMENT No. 07",
    "Endorsement reference: TMI-END-07",
    "Amends: TMI-HOME-v3",
    "Insurer: Tallowood Mutual Insurance",
    "Product: Tallowood Home Insurance",
    "Effective date: 1 July 2025",
    "",
    "This endorsement changes your policy wording. It takes precedence over the Wording.",
    "",
    "3 Flood cover",
    "3.1 Clause 4.2(c) of the Wording is deleted in its entirety.",
    "4 Flood excess",
    "4.1 The following clause 3.2 is inserted into the Wording: The flood excess is $2,000 for",
    "each claim caused by flood.",
  ],
  "TMI-PREMIER-v1.pdf": [
    "HOME INSURANCE POLICY WORDING",
    "Wording reference: TMI-PREMIER-v1",
    "Insurer: Tallowood Mutual Insurance",
    "Product: Tallowood Premier Home",
    "Effective date: 1 March 2025",
    "",
    "Section 3 Excess",
    "3.1 The basic excess is $500 for each claim.",
    "3.2 The flood excess is $1,000 for each claim caused by flood.",
    "3.3 Only the highest applicable excess is deducted for each event.",
    "Section 4 What we do not cover",
    "4.2 We do not cover:",
    "(a) loss or damage caused by wear and tear;",
    "(b) gradual damage.",
    "Section 5 Limits",
    "5.1 The most we will pay for building damage is the building sum insured shown in your schedule,",
    "plus a safety net of 10%.",
    "5.2 We deduct the excess after applying the limits in clause 5.1.",
    "5.3 We pay up to $5,000 for any one item of jewellery or watches unless it is specified in",
    "your schedule.",
    "5.4 We pay for temporary accommodation up to 10% of the building sum insured, for no more",
    "than 18 months.",
    "Section 6 Making a claim",
    "6.1 Your claim will be referred to a senior assessor before payment if the settlement amount",
    "is more than $250,000.",
    "6.2 If a repair quote or proof of ownership is missing, we will ask you for it before we decide",
    "your claim.",
  ],
  "unrelated-facilities-report.pdf": [
    "QUARTERLY FACILITIES REPORT",
    "Prepared for: Operations Committee",
    "Period: July to September 2026",
    "",
    "1 Summary",
    "Lift maintenance was completed on schedule. Two minor water leaks were repaired.",
    "The basement car park lighting upgrade is 60% complete.",
    "2 Costs",
    "Total spend for the quarter was $18,400 against a budget of $21,000.",
  ],
};

const esc = (s) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
function pdf(lines) {
  let y = 800;
  const ops = ["BT", "/F1 10 Tf"];
  for (const l of lines) {
    if (l) ops.push(`1 0 0 1 50 ${y} Tm (${esc(l)}) Tj`);
    y -= l ? 15 : 9;
  }
  ops.push("ET");
  const stream = ops.join("\n");
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  ];
  let out = "%PDF-1.4\n";
  const offs = [];
  objs.forEach((o, i) => { offs.push(Buffer.byteLength(out)); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(out);
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return out;
}
for (const [name, lines] of Object.entries(docs)) writeFileSync(`samples/${name}`, pdf(lines));
console.log("wrote", Object.keys(docs).length, "PDFs");
