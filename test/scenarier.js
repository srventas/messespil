// Kvalitetstest af scenarierne i Slikboden. Læser CONFIG og modellen direkte fra index.html.
// Kør: node test/scenarier.js   (exit-kode 1, hvis et krav ikke er opfyldt)
"use strict";
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const cfgKilde = html.match(/const CONFIG = ([\s\S]*?);\s*\/\/ =+ CONFIG SLUT/);
const modelKilde = html.match(/\/\/ -+ Spil 2: model -+\n([\s\S]*?)\/\/ -+ Spil 2: model slut/);
if (!cfgKilde || !modelKilde) { console.error("Kunne ikke finde CONFIG eller modellen i index.html"); process.exit(1); }
const CONFIG = new Function(`return (${cfgKilde[1]});`)();
const { beregn, vurder, alleValg } = new Function(`${modelKilde[1]}; return { beregn, vurder, alleValg };`)();
const c = CONFIG.spil2;

// Alle mulige scenarier (stedet påvirker ikke tallene).
const scenarier = [];
for (const gruppe of c.kundegrupper) for (const antal of c.antal) for (const vejr of c.vejr)
  scenarier.push({ gruppe, antal, vejr, sted: gruppe.steder[0] });

const navn = (v) => `${v.pris} kr / ${v.indkoeb} / ${v.mf}`;
const optioner = { pris: c.priser, indkoeb: c.indkoeb, mf: Object.keys(c.markedsfoering) };

console.log("Bedste valg pr. scenarie (gode valg i parentes)\n");
const rapporter = scenarier.map((sc) => {
  // For hver parameter: hvilke valg tæller som gode, uanset de andre valg?
  const gode = {};
  for (const felt of ["pris", "mf"]) {
    gode[felt] = optioner[felt].filter((o) => {
      const v = alleValg(c).find((x) => x[felt] === o);
      return vurder(c, sc, v).god[felt] || alleValg(c).some((x) => x[felt] === o && vurder(c, sc, x).god[felt]);
    });
  }
  const r = vurder(c, sc, alleValg(c)[0]);
  gode.indkoeb = optioner.indkoeb.filter((k) => vurder(c, sc, { ...r.bedst, indkoeb: k }).god.indkoeb);
  console.log(`${sc.gruppe.id.padEnd(7)} ${String(sc.antal.kunder).padStart(3)} vejr ${sc.vejr.faktor.toFixed(2)}  ` +
    `${navn(r.bedst).padEnd(20)} ${String(r.max).padStart(5)} kr  (${gode.pris.join("/")} · ${gode.indkoeb.join("/")} · ${gode.mf.join("/")})`);
  return { sc, r, gode };
});
console.log("");

const fejl = [];
const krav = (id, ok, tekst) => { console.log(`${ok ? "OK  " : "FEJL"} ${id}: ${tekst}`); if (!ok) fejl.push(id); };

// S1: Hvert valg er det bedste i mindst ét scenarie, så alle knapper giver mening.
for (const felt of ["pris", "indkoeb", "mf"]) {
  const brugt = new Set(rapporter.map((x) => x.r.bedst[felt]));
  const mangler = optioner[felt].filter((o) => !brugt.has(o));
  krav("S1", mangler.length === 0, `${felt}: alle valg er bedst mindst én gang${mangler.length ? `, mangler ${mangler.join(", ")}` : ""}`);
}

// S2: Kundegruppen afgør prisen. For hver gruppe er samme pris bedst i mindst 75 % af scenarierne,
// og mindst 3 grupper har forskellig typisk pris.
const typisk = (felt) => c.kundegrupper.map((g) => {
  const egne = rapporter.filter((x) => x.sc.gruppe === g);
  const taelling = {};
  egne.forEach((x) => (taelling[x.r.bedst[felt]] = (taelling[x.r.bedst[felt]] || 0) + 1));
  const [vaerdi, n] = Object.entries(taelling).sort((a, b) => b[1] - a[1])[0];
  return { id: g.id, vaerdi, andel: n / egne.length };
});
for (const felt of ["pris", "mf"]) {
  const t = typisk(felt);
  const svag = t.filter((x) => x.andel < 0.75);
  krav("S2", svag.length === 0 && new Set(t.map((x) => x.vaerdi)).size >= (felt === "pris" ? 3 : 2),
    `${felt} følger kundegruppen: ${t.map((x) => `${x.id} ${x.vaerdi} (${Math.round(x.andel * 100)} %)`).join(", ")}`);
}

// S3: Valgene betyder noget. I intet scenarie er mere end én parameter ligegyldig (alle valg gode).
const ligegyldige = rapporter.filter((x) =>
  ["pris", "indkoeb", "mf"].filter((f) => x.gode[f].length === optioner[f].length).length > 1);
krav("S3", ligegyldige.length === 0, `scenarier med mere end én ligegyldig parameter: ${ligegyldige.length}`);

// S4: Det bedste valg giver altid overskud.
const minMax = Math.min(...rapporter.map((x) => x.r.max));
krav("S4", minMax > 0, `laveste bedst mulige overskud: ${minMax} kr`);

// S5: Underskud er muligt med dårlige valg.
const minAlle = Math.min(...scenarier.flatMap((sc) => alleValg(c).map((v) => beregn(c, sc, v).overskud)));
krav("S5", minAlle < 0, `laveste mulige resultat: ${minAlle} kr`);

if (fejl.length) { console.log(`\nKrav ikke opfyldt: ${[...new Set(fejl)].join(", ")}`); process.exit(1); }
console.log("\nAlle scenariekrav er opfyldt.");
