// @ts-check
// End-to-end-test af messespillet. Kør: npx playwright test
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const SKAERMBILLEDER = path.join(__dirname, "screenshots");
const AXE = require.resolve("axe-core/axe.min.js");
const FORBUDT = /vind|vundet|PLADSHOLDER|TODO|[–—·]/i; // prik som separator er erstattet af pipe

async function aaben(page, seed) {
  await page.goto(seed === undefined ? "/index.html" : `/index.html?seed=${seed}`);
  await expect(page.locator("#start")).toBeVisible();
}

async function hentConfig(page) {
  return page.evaluate(() => JSON.parse(JSON.stringify(window.__messespil.CONFIG)));
}

// Synlig tekst på den aktive skærm må ikke indeholde forbudte ord eller tankestreger.
async function tjekTekst(page) {
  const tekst = await page.locator(".skaerm.aktiv").innerText();
  expect(tekst, `forbudt tekst på skærmen:\n${tekst}`).not.toMatch(FORBUDT);
}

async function tjekAxe(page) {
  await page.addScriptTag({ path: AXE });
  const resultat = await page.evaluate(async () =>
    // @ts-ignore
    window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] }));
  const fejl = resultat.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  expect(fejl, fejl.join("\n")).toEqual([]);
}

async function skaermbillede(page, testInfo, navn) {
  if (testInfo.project.name !== "iphone-13") return;
  fs.mkdirSync(SKAERMBILLEDER, { recursive: true });
  await page.screenshot({ path: path.join(SKAERMBILLEDER, `${navn}.png`), fullPage: true });
}

// Spiller Spil 1. strategi(kort) returnerer "fordom", "virkelighed" eller "swipe-venstre"/"swipe-hoejre".
async function spilSpil1(page, strategi, undervejs) {
  const cfg = await hentConfig(page);
  const efterUdsagn = Object.fromEntries(cfg.spil1.kort.map((k) => [k.udsagn, k]));
  await page.getByRole("button", { name: /Fordom eller virkelighed\?/ }).click();
  await page.locator("#s1-start").click();
  const set = [];
  for (let i = 0; i < 8; i++) {
    await expect(page.locator("#s1-taeller")).toHaveText(`${i + 1}/8`);
    const udsagn = await page.locator("#s1-udsagn").innerText();
    const kort = efterUdsagn[udsagn];
    expect(kort, `ukendt kort: ${udsagn}`).toBeTruthy();
    set.push(kort);
    const valg = strategi(kort);
    if (valg.startsWith("swipe")) {
      const boks = await page.locator("#s1-kort").boundingBox();
      const x = boks.x + boks.width / 2, y = boks.y + boks.height / 2;
      const dx = (valg === "swipe-venstre" ? -1 : 1) * boks.width * 0.45;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + dx, y + 10, { steps: 12 });
      await page.mouse.up();
    } else {
      await page.locator(`[data-svar="${valg}"]`).click();
    }
    await expect(page.locator("#s1-feedback")).toBeVisible();
    if (undervejs) await undervejs(i);
    await page.locator("#s1-naeste").click();
  }
  await expect(page.locator("#bevis")).toBeVisible();
  return set;
}

// Læser scenariet på skærmen og finder det bedste valg med spillets egen model.
async function analyserScenarie(page) {
  const tekst = {
    sted: await page.locator("#s2-sted").innerText(),
    antal: await page.locator("#s2-antal").innerText(),
    vejr: await page.locator("#s2-vejr").innerText()
  };
  return page.evaluate((t) => {
    const { CONFIG, vurder } = window.__messespil;
    const c = CONFIG.spil2;
    const gruppe = c.kundegrupper.find((g) => g.steder.includes(t.sted));
    const sc = { gruppe, sted: t.sted, antal: c.antal.find((a) => a.tekst === t.antal), vejr: c.vejr.find((v) => v.tekst === t.vejr) };
    const r = vurder(c, sc, { pris: c.priser[0], indkoeb: c.indkoeb[0], mf: "intet" });
    return { gruppe: gruppe.id, sc: { gruppe: gruppe.id, antal: sc.antal.kunder, vejr: sc.vejr.faktor },
             bedst: { pris: r.bedst.pris, indkoeb: r.bedst.indkoeb, mf: r.bedst.mf }, max: r.max };
  }, tekst);
}

async function beregnValg(page, info, valg) {
  return page.evaluate(({ info, valg }) => {
    const { CONFIG, vurder } = window.__messespil;
    const c = CONFIG.spil2;
    const sc = { gruppe: c.kundegrupper.find((g) => g.id === info.sc.gruppe),
                 antal: c.antal.find((a) => a.kunder === info.sc.antal), vejr: c.vejr.find((v) => v.faktor === info.sc.vejr) };
    const r = vurder(c, sc, valg);
    return { overskud: r.egen.overskud, god: r.god, gode: Object.values(r.god).filter(Boolean).length };
  }, { info, valg });
}

async function vaelgIBoden(page, valg) {
  await page.locator(`label:has(input[name="pris"][value="${valg.pris}"])`).click();
  await page.locator(`label:has(input[name="indkoeb"][value="${valg.indkoeb}"])`).click();
  await page.locator(`label:has(input[name="mf"][value="${valg.mf}"])`).click();
}

// Spiller Slikboden. strategi(info) returnerer valget; standard er det bedste valg.
async function spilSpil2(page, undervejs, strategi = (info) => info.bedst) {
  await page.getByRole("button", { name: /Slikboden/ }).click();
  if (undervejs) await undervejs("intro");
  await page.locator("#s2-start").click();
  const runder = [];
  for (let runde = 0; runde < 2; runde++) {
    await expect(page.locator("#s2-valg")).toBeVisible();
    await expect(page.locator("#s2-valg-h")).toHaveText(`Runde ${runde + 1} af 2`);
    await expect(page.locator("#s2-aabn")).toBeDisabled();
    const info = await analyserScenarie(page);
    const valg = strategi(info);
    await vaelgIBoden(page, valg);
    await expect(page.locator("#s2-aabn")).toBeEnabled();
    runder.push({ info, valg, ...(await beregnValg(page, info, valg)) });
    if (undervejs) await undervejs(`valg-${runde + 1}`);
    await page.locator("#s2-aabn").click();
    await expect(page.locator("#s2-dag")).toBeVisible();
    if (undervejs) await undervejs(`dag-${runde + 1}`);
    await page.locator("#s2-videre").click();
  }
  await expect(page.locator("#s2-slut")).toBeVisible();
  if (undervejs) await undervejs("slut");
  await page.locator("#s2-bevis").click();
  await expect(page.locator("#bevis")).toBeVisible();
  return runder;
}

const rigtigt = (k) => (k.svar === "virkelighed" ? "virkelighed" : "fordom");
const forkert = (k) => (k.svar === "fordom" ? "virkelighed" : "fordom");

test("Spil 1 med knapper giver korrekt X ud af 8", async ({ page }) => {
  await aaben(page, 11);
  // Svarer rigtigt på de første 5 og forkert på resten.
  let n = 0;
  const set = await spilSpil1(page, (k) => (n++ < 5 ? rigtigt(k) : forkert(k)));
  const forventet = set.filter((k, i) => i < 5 || k.svar === "begge").length;
  await expect(page.locator("#bevis-resultat")).toHaveText(`Du ramte ${forventet} ud af 8`);
});

test("Spil 1 kan gennemføres med swipe", async ({ page }) => {
  await aaben(page, 12);
  const set = await spilSpil1(page, (k) => (k.svar === "fordom" ? "swipe-venstre" : "swipe-hoejre"));
  expect(set).toHaveLength(8);
  await expect(page.locator("#bevis-resultat")).toHaveText("Du ramte 8 ud af 8");
});

test("Kort swipet under 35 % snapper tilbage uden svar", async ({ page }) => {
  await aaben(page, 13);
  await page.getByRole("button", { name: /Fordom eller virkelighed\?/ }).click();
  await page.locator("#s1-start").click();
  const boks = await page.locator("#s1-kort").boundingBox();
  const x = boks.x + boks.width / 2, y = boks.y + boks.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + boks.width * 0.2, y, { steps: 6 });
  await page.mouse.up();
  await expect(page.locator("#s1-feedback")).toBeHidden();
  await expect(page.locator("#s1-taeller")).toHaveText("1/8");
});

test("Trækregler holder over 300 seeds", async ({ page }) => {
  await aaben(page);
  const fejl = await page.evaluate(() => {
    const { CONFIG, traekKort, lavRng } = window.__messespil;
    const c = CONFIG.spil1;
    const fejl = [];
    const erVirk = (k) => k.svar !== "fordom";
    for (let s = 1; s <= 300; s++) {
      const d = traekKort(c, new Set(), lavRng(s));
      const ids = d.map((k) => k.id);
      const grupper = d.filter((k) => k.gruppe).map((k) => k.gruppe);
      const v = d.filter(erVirk).length;
      if (d.length !== c.antal) fejl.push(`seed ${s}: ${d.length} kort`);
      if (new Set(ids).size !== ids.length) fejl.push(`seed ${s}: dubletter`);
      if (d.some((k) => !k.aktiv)) fejl.push(`seed ${s}: inaktivt kort`);
      if (new Set(grupper).size !== grupper.length) fejl.push(`seed ${s}: to kort fra samme gruppe`);
      if (v < c.minVirkelighed || v > c.maxVirkelighed) fejl.push(`seed ${s}: ${v} virkelighed`);
    }
    return fejl;
  });
  expect(fejl).toEqual([]);
});

test("Spil igen foretrækker usete kort", async ({ page }) => {
  await aaben(page);
  const fejl = await page.evaluate(() => {
    const { CONFIG, traekKort, lavRng } = window.__messespil;
    const c = CONFIG.spil1;
    const erVirk = (k) => k.svar !== "fordom";
    const fejl = [];
    for (let s = 1; s <= 200; s++) {
      const r = lavRng(s);
      const sete = new Set(traekKort(c, new Set(), r).map((k) => k.id));
      const d2 = traekKort(c, sete, r);
      const ids2 = new Set(d2.map((k) => k.id));
      // Et set kort må kun være med, hvis intet uset kort af samme type kunne have taget dets plads.
      for (const k of d2.filter((k) => sete.has(k.id))) {
        const andreGrupper = new Set(d2.filter((x) => x !== k && x.gruppe).map((x) => x.gruppe));
        const erstatning = c.kort.find((u) => u.aktiv && !sete.has(u.id) && !ids2.has(u.id) &&
          erVirk(u) === erVirk(k) && !(u.gruppe && andreGrupper.has(u.gruppe)));
        if (erstatning) fejl.push(`seed ${s}: ${k.id} genbrugt, selvom ${erstatning.id} var uset`);
      }
    }
    return fejl;
  });
  expect(fejl).toEqual([]);
});

test("Kort med svar 'begge' tæller som rigtigt begge veje", async ({ page }) => {
  await aaben(page);
  // Find et seed, hvor kortet f3 bliver trukket.
  const seed = await page.evaluate(() => {
    const { CONFIG, traekKort, lavRng } = window.__messespil;
    for (let s = 1; s < 1000; s++) if (traekKort(CONFIG.spil1, new Set(), lavRng(s)).some((k) => k.svar === "begge")) return s;
    return -1;
  });
  expect(seed).toBeGreaterThan(0);
  for (const retning of ["fordom", "virkelighed"]) {
    await aaben(page, seed);
    const set = await spilSpil1(page, (k) => (k.svar === "begge" ? retning : forkert(k)));
    const antalBegge = set.filter((k) => k.svar === "begge").length;
    await expect(page.locator("#bevis-resultat")).toHaveText(`Du ramte ${antalBegge} ud af 8`);
  }
});

test("Spil 2: bedste valg giver 6 af 6, to forskellige kundegrupper", async ({ page }) => {
  test.setTimeout(120000);
  for (const seed of [1, 2, 3, 4, 5]) {
    await aaben(page, seed);
    const runder = await spilSpil2(page);
    expect(runder[0].info.gruppe).not.toEqual(runder[1].info.gruppe);
    const total = runder[0].info.max + runder[1].info.max;
    await expect(page.locator("#bevis-resultat")).toHaveText(`6 af 6 gode valg. Overskud: ${total} kr`);
  }
});

test("Spil 2: dårlige valg giver færre gode valg og vises neutralt", async ({ page }) => {
  test.setTimeout(60000);
  for (const seed of [3, 8]) {
    await aaben(page, seed);
    // Modsat det bedste på alle tre parametre.
    const runder = await spilSpil2(page, null, (info) => ({
      pris: info.bedst.pris === 20 ? 10 : 20,
      indkoeb: info.bedst.indkoeb >= 60 ? 20 : 80,
      mf: info.bedst.mf === "some" ? "intet" : "some"
    }));
    const gode = runder[0].gode + runder[1].gode;
    const total = runder[0].overskud + runder[1].overskud;
    expect(gode).toBeLessThan(6);
    const penge = total >= 0 ? `Overskud: ${total} kr` : `Underskud: ${-total} kr`;
    await expect(page.locator("#bevis-resultat")).toHaveText(`${gode} af 6 gode valg. ${penge}`);
  }
});

test("Spil 2: resultatskærmen markerer valg uden rødt", async ({ page }) => {
  await aaben(page, 4);
  await page.getByRole("button", { name: /Slikboden/ }).click();
  await page.locator("#s2-start").click();
  const info = await analyserScenarie(page);
  // Find en pris, som ikke er et godt valg i dette scenarie.
  let valg;
  for (const pris of [10, 15, 20]) {
    const forsoeg = { ...info.bedst, pris };
    if (!(await beregnValg(page, info, forsoeg)).god.pris) { valg = forsoeg; break; }
  }
  expect(valg).toBeTruthy();
  await vaelgIBoden(page, valg);
  await page.locator("#s2-aabn").click();
  await expect(page.locator("#s2-dag")).toBeVisible();
  await expect(page.locator(".vurdering")).toHaveCount(3);
  const farver = await page.locator(".vurdering").evaluateAll((el) => el.map((e) => getComputedStyle(e).backgroundColor));
  for (const f of farver) expect(["rgb(121, 222, 168)", "rgb(204, 215, 234)"]).toContain(f);
  await expect(page.locator(".vurdering.bedre").first()).toContainText("Pris");
});

test("Bevis-skærmen har levende ur og kørende animation", async ({ page }) => {
  await aaben(page, 21);
  await spilSpil1(page, rigtigt);
  const ur = page.locator("#bevis-ur");
  await expect(ur).toHaveText(/^\d\d:\d\d:\d\d$/);
  const t1 = await ur.innerText();
  await page.waitForTimeout(1500);
  const t2 = await ur.innerText();
  expect(t2).not.toEqual(t1);
  await expect(page.locator("#bevis-dato")).toHaveText(/^(mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag) \d{1,2}\. [a-z]+$/);
  const animation = await page.evaluate(() =>
    document.querySelector(".flueben").getAnimations().map((a) => ({
      tilstand: a.playState, gentagelser: a.effect.getTiming().iterations
    })));
  expect(animation.some((a) => a.tilstand === "running" && a.gentagelser === Infinity)).toBe(true);
});

test("Bevis-skærmen kan ikke nås via URL", async ({ page }) => {
  for (const url of ["/index.html#bevis", "/index.html?bevis=1", "/index.html?skaerm=bevis#bevis"]) {
    await page.goto(url);
    await expect(page.locator("#start")).toBeVisible();
    await expect(page.locator("#bevis")).toBeHidden();
  }
});

test("Spil igen nulstiller alt", async ({ page }) => {
  await aaben(page, 31);
  await spilSpil2(page);
  await page.locator("#bevis-igen").click();
  await expect(page.locator("#start")).toBeVisible();
  await page.getByRole("button", { name: /Fordom eller virkelighed\?/ }).click();
  await page.locator("#s1-start").click();
  await expect(page.locator("#s1-taeller")).toHaveText("1/8");
  await page.goto("/index.html?seed=31");
  await spilSpil1(page, rigtigt);
  await page.locator("#bevis-igen").click();
  await page.getByRole("button", { name: /Slikboden/ }).click();
  await page.locator("#s2-start").click();
  await expect(page.locator("#s2-valg-h")).toHaveText("Runde 1 af 2");
  await expect(page.locator('#s2-form input:checked')).toHaveCount(0);
});

test("Offline efter load og ingen lagring", async ({ page, context }) => {
  const efterLoad = [];
  await aaben(page, 41);
  page.on("request", (r) => efterLoad.push(r.url()));
  await context.route("**/*", (r) => r.abort());
  await context.setOffline(true);
  await spilSpil1(page, rigtigt);
  await page.locator("#bevis-igen").click();
  await spilSpil2(page);
  expect(efterLoad).toEqual([]);
  const lager = await page.evaluate(() => ({
    local: localStorage.length, session: sessionStorage.length, cookie: document.cookie
  }));
  expect(lager).toEqual({ local: 0, session: 0, cookie: "" });
  expect(await context.cookies()).toEqual([]);
});

test("Ingen eksterne ressourcer og filstørrelse under 300 KB", async () => {
  const fil = path.join(__dirname, "..", "index.html");
  const html = fs.readFileSync(fil, "utf8");
  expect(fs.statSync(fil).size).toBeLessThan(300 * 1024);
  expect(html).not.toMatch(/<(script|link|img|iframe)[^>]+(src|href)=["']?(https?:)?\/\//i);
  expect(html).not.toMatch(/url\(\s*["']?(https?:)?\/\//i);
  expect(html).not.toMatch(/localStorage\.|sessionStorage\.|indexedDB|document\.cookie\s*=/);
});

test("Alle skærme: tekstregler, tilgængelighed og skærmbilleder", async ({ page }, testInfo) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 390, height: 844 });
  await aaben(page, 7);
  const tjek = async (navn) => {
    await page.waitForTimeout(300); // lad overgangen blive færdig
    await tjekTekst(page);
    await tjekAxe(page);
    await skaermbillede(page, testInfo, navn);
  };
  await tjek("01-start");
  await page.getByRole("button", { name: /Fordom eller virkelighed\?/ }).click();
  await tjek("02-spil1-intro");
  await page.goto("/index.html?seed=7");
  let nr = 0; // første kort rigtigt, andet forkert, så begge feedbacktyper fotograferes
  await spilSpil1(page, (k) => (nr++ === 1 ? forkert(k) : rigtigt(k)), async (i) => {
    if (i === 0) await tjek("04-spil1-feedback");
    if (i === 1) await tjek("05-spil1-feedback-neutral");
  });
  await tjek("06-bevis-spil1");
  await page.locator("#bevis-igen").click();
  await page.getByRole("button", { name: /Fordom eller virkelighed\?/ }).click();
  await page.locator("#s1-start").click();
  await tjek("03-spil1-kort");
  await page.goto("/index.html?seed=7");
  await spilSpil2(page, async (trin) => {
    const navne = { intro: "07-spil2-intro", "valg-1": "08-spil2-runde1-valg", "dag-1": "09-spil2-runde1-resultat",
                    "valg-2": "10-spil2-runde2-valg", "dag-2": "11-spil2-runde2-resultat", slut: "12-spil2-slut" };
    await tjek(navne[trin]);
  });
  await tjek("13-bevis-spil2");
});

test("Reduceret bevægelse: flueben pulserer stadig, og spillet kan gennemføres", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await aaben(page, 51);
  await spilSpil1(page, rigtigt);
  const animation = await page.evaluate(() =>
    document.querySelector(".flueben").getAnimations().map((a) => a.effect.getTiming().iterations));
  expect(animation).toContain(Infinity);
});
