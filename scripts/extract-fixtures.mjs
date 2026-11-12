// Extracts page text from samples/*.pdf with pdf.js (same joining as the browser) into src/engine/__fixtures__/pdf-text.json.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const out = {};
for (const name of readdirSync("samples").filter((f) => f.endsWith(".pdf")).sort()) {
  const doc = await getDocument({ data: new Uint8Array(readFileSync(`samples/${name}`)), useSystemFonts: false }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const tc = await (await doc.getPage(i)).getTextContent();
    pages.push(tc.items.map((it) => ("str" in it ? it.str + (it.hasEOL ? "\n" : " ") : "")).join(""));
  }
  out[name] = { name, pages };
}
writeFileSync("src/engine/__fixtures__/pdf-text.json", JSON.stringify(out, null, 2) + "\n");
console.log("extracted", Object.keys(out).join(", "));
