// Balancetest af Slikboden. Læser CONFIG direkte fra index.html, så tallene kun findes ét sted.
// Kør: node test/balance.js   (exit-kode 1, hvis et balancekrav ikke er opfyldt)
"use strict";
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const m = html.match(/const CONFIG = ([\s\S]*?);\s*\/\/ =+ CONFIG SLUT/);
if (!m) { console.error("Kunne ikke finde CONFIG i index.html"); process.exit(1); }
const CONFIG = new Function(`return (${m[1]});`)();
const c = CONFIG.spil2;

function overskud(pris, indkoeb, mf, h) {
  const mm = c.markedsfoering[mf];
  const eft = Math.round(c.grundefterspoergsel[pris] * mm.faktor * h.faktor[pris]);
  const solgt = Math.min(indkoeb, eft);
  return solgt * pris - indkoeb * c.indkoebspris - mm.pris;
}

const kombi = [];
for (const p of c.priser) for (const k of c.indkoeb) for (const mf of Object.keys(c.markedsfoering)) kombi.push({ p, k, mf });
const navn = (x) => `${x.p} kr / ${x.k} / ${x.mf}`;

console.log("Overskud pr. kombination og hændelse\n");
console.log("Kombination".padEnd(22) + c.haendelser.map((_, i) => `H${i + 1}`.padStart(6)).join(""));
for (const x of kombi) {
  console.log(navn(x).padEnd(22) + c.haendelser.map((h) => String(overskud(x.p, x.k, x.mf, h)).padStart(6)).join(""));
}
console.log("");
c.haendelser.forEach((h, i) => console.log(`H${i + 1}: ${h.tekst}`));
console.log("");

const bedste = c.haendelser.map((h) => {
  const r = kombi.map((x) => ({ x, v: overskud(x.p, x.k, x.mf, h) })).sort((a, b) => b.v - a.v);
  return { h, r };
});
bedste.forEach(({ h, r }, i) =>
  console.log(`H${i + 1} bedst: ${navn(r[0].x)} (${r[0].v} kr), næstbedst: ${navn(r[1].x)} (${r[1].v} kr)`));
console.log("");

const tops = bedste.map((b) => b.r[0].x);
const fejl = [];
const krav = (id, ok, tekst) => { console.log(`${ok ? "OK  " : "FEJL"} ${id}: ${tekst}`); if (!ok) fejl.push(id); };

const unikke = new Set(tops.map(navn));
const altidBedst = kombi.some((x) => bedste.every((b) => navn(b.r[0].x) === navn(x)));
krav("B1", !altidBedst && unikke.size >= 4, `ingen kombination bedst på alle hændelser; ${unikke.size} forskellige bedste (krav: mindst 4)`);
const n10 = tops.filter((x) => x.p === 10).length, n15 = tops.filter((x) => x.p === 15).length;
krav("B2", n10 >= 2 && n15 >= 2, `10 kr bedst på ${n10}, 15 kr bedst på ${n15} hændelser (krav: mindst 2 hver)`);
const mfs = new Set(tops.map((x) => x.mf));
krav("B3", mfs.size >= 2, `${mfs.size} markedsføringsvalg indgår i en bedste kombination (krav: mindst 2)`);
const gap = Math.max(...bedste.map((b) => b.r[0].v / b.r[1].v));
krav("B4", gap <= 1.25, `største forspring for bedste over næstbedste: ${Math.round((gap - 1) * 100)} % (krav: højst 25 %)`);
const fornuftig = c.haendelser.map((h) => overskud(10, 40, "skilt", h));
krav("B5", fornuftig.every((v) => v > 0), `10 kr / 40 / skilt giver ${fornuftig.join(", ")} kr (krav: overskud overalt)`);
const minimum = Math.min(...bedste.flatMap((b) => b.r.map((y) => y.v)));
krav("B6", minimum < 0, `laveste mulige resultat: ${minimum} kr (krav: underskud muligt)`);

if (fejl.length) { console.log(`\nBalancekrav ikke opfyldt: ${fejl.join(", ")}`); process.exit(1); }
console.log("\nAlle balancekrav er opfyldt.");
