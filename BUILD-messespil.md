# Byggeinstruktion: Messespil til uddannelsesmesse (HHX · EUX)

Denne fil er en komplet specifikation til Claude Code. Byg præcis det, der står her. Hvor noget er markeret `TODO-FAKTA`, er værdien ikke endeligt tjekket og rettes senere af Jakob. Byg med værdien, som den står.

**Version 2.** Ændringer i forhold til version 1:
- Spil 1 trækker 8 tilfældige kort fra en pulje i stedet for 8 faste kort.
- Slikbodens model er ombygget, så ingen opskrift vinder hver gang. Dagens hændelse vises nu før valget.
- Kravet om intet skolenavn er droppet.
- Dagskoden er erstattet af et levende ur på bevis-skærmen, så intet skal ændres eller deployes på messedagen.
- "Spil 3" hedder nu "Spil 2".

---

## 1. Formål og kontekst

- Et lille mobilspil, som besøgende ved en messestand åbner via en QR-kode.
- Når et spil er gennemført, vises en **bevis-skærm**, som spilleren viser ved standen og får udleveret en mulepose.
- Målgruppe: elever i 8.–10. klasse (14–16 år), på egen telefon, stående ved en stand med dårlig dækning.
- Branding: "HHX", "EUX", linjen "Tæt på dig. Tæt på virkeligheden." og skolens navn (fra `CONFIG.afsender.skole`).
- **Afvikling uden Jakob:** Spillet skal kunne køre en hel messedag, uden at nogen ændrer, deployer eller husker noget. Standpersonalet skal kun kunne genkende en gyldig bevis-skærm (se afsnit 4.2 og 10).

## 2. Ufravigelige krav

| # | Krav |
|---|---|
| K1 | **Én selvstændig fil**: `index.html` med al CSS og JS inline. Ingen eksterne requests (ingen CDN, ingen Google Fonts, ingen billeder udefra). |
| K2 | Filstørrelse under **300 KB**. |
| K3 | Virker **offline**, når siden først er indlæst (ingen netkald efter load). |
| K4 | **Ingen dataindsamling i appen**: ingen cookies, ingen analytics, ingen localStorage/sessionStorage/IndexedDB, ingen formularer, ingen tracking. (Mindreårige, GDPR.) Bemærk: hosting-udbyderen logger IP-adresser på serverniveau. Det skal stå i README, ikke skjules. |
| K5 | **Man kan ikke tabe.** Begge spil ender altid på bevis-skærmen. Ordet "vind/vundet" må ikke bruges; brug "gennemført". |
| K6 | Mobile-first: designet til 360–430 px bredde, portræt. Skal også se ordentligt ud på desktop (centreret kolonne, max-bredde 480 px). |
| K7 | Al UI-tekst på **dansk**. Ingen tankestreger (–/—) i UI-tekst; brug punktum eller komma. |
| K8 | Al spilindhold (kort, tekster, modelparametre, skolenavn) ligger i **ét `CONFIG`-objekt øverst i `<script>`**, så det kan rettes uden at røre logikken. |
| K9 | Tilgængelighed: alt kan betjenes med knapper (swipe er en genvej, ikke eneste vej), tekst min. 18 px, kontrast mindst WCAG AA, `prefers-reduced-motion` respekteres (animationer dæmpes, men bevis-animationen må stadig pulsere langsomt, og uret skal stadig gå). |
| K10 | **Ingen daglig vedligeholdelse.** Intet i filen må kræve ændring før en messedag. |

## 3. Design

**Farver (brandpalet, brug kun disse):**

| Rolle | Hex |
|---|---|
| Primær blå (knapper, overskrifter, mørk baggrund) | `#004998` |
| Navy (tekst, mørk baggrund) | `#003764` |
| Lys blå (lys baggrund, kort) | `#CCD7EA` |
| Grøn (positiv feedback, highlight) | `#79DEA8` |
| Orange (**kun** primær CTA-knap, fx "Start" og "Vis bevis") | `#FF6B00` |
| Hvid | `#FFFFFF` |

**Læsbarhedsregler:**
- Hvid tekst **kun** på `#004998` eller `#003764`.
- På grøn, lys blå og hvid baggrund: navy tekst.
- Orange bruges aldrig som fladebaggrund, kun på CTA-knapper (med navy eller hvid tekst; vælg den med bedst kontrast og verificér AA).
- Forkert svar markeres **ikke** med rødt eller kryds. Brug neutral navy/lys blå.

**Typografi:** Systemfont-stack (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`). Fed, stor, rund og venlig. Brandfonten Nudista må ikke indlejres (licens uafklaret).

**Stil:** Rent, fladt, store touch-flader (min. 48 px høje knapper), runde hjørner (12–16 px), korte overgange (150–250 ms). Ingen emojis i UI-tekst.

## 4. Skærmflow

```
[Startskærm] ─┬─> [Spil 1: Fordom eller virkelighed?] ─┐
              └─> [Spil 2: Slikboden] ─────────────────┴─> [Bevis-skærm]
```

### 4.1 Startskærm
- Øverst: "HHX · EUX" (lille, navy).
- Overskrift: "Spil og hent din pose"
- Undertekst: "Vælg et spil. Det tager under to minutter."
- To store valgkort (kan trykkes):
  - **Fordom eller virkelighed?**: "8 udsagn. Swipe dem på plads." ca. 1 min
  - **Slikboden**: "Driv en slikbod i 2 dage. Hvor meget tjener du?" ca. 2 min
- Nederst, lille: `CONFIG.afsender.skole`.

### 4.2 Bevis-skærm (fælles afslutning)
- Baggrund `#004998`, hvid tekst.
- Stort animeret flueben (SVG, tegnes ind og pulserer derefter langsomt i en uendelig løkke).
- Overskrift: "Gennemført!"
- Resultatlinje fra spillet (fx "Du ramte 6 ud af 8" eller "Dit overskud: 312 kr").
- **Levende ur** i stor tekst i en hvid boks med navy tekst: klokkeslæt med sekunder (`14:32:07`), opdateret hvert sekund, og under det dagens dato (`torsdag 9. oktober`). Brug enhedens tid. Et skærmbillede viser et ur, der står stille eller viser forkert tid. Standpersonalet skal ikke kende nogen kode.
- Instruktion: "Vis skærmen ved standen og få din pose."
- Nederst: "Tæt på dig. Tæt på virkeligheden.", "HHX · EUX" og `CONFIG.afsender.skole`.
- Knap (sekundær, diskret): "Spil igen" → startskærm.
- Bevis-skærmen må ikke kunne nås via URL-hash, query-parameter eller direkte link; kun ved at gennemføre et spil.

## 5. Spil 1: "Fordom eller virkelighed?"

### Mekanik
1. Kort intro (én skærm): "Er det en fordom eller virkeligheden? Swipe til venstre for fordom, til højre for virkelighed." Knap: "Start".
2. Spillet trækker **8 kort** fra puljen `CONFIG.spil1.kort` efter trækreglerne nedenfor og viser ét ad gangen. Fremskridt vises som "3/8" eller prikker.
3. Spilleren svarer ved:
   - at swipe kortet til venstre (Fordom) eller højre (Virkelighed). Kortet følger fingeren og roterer let; svar registreres ved > 35 % af bredden, ellers snapper det tilbage,
   - eller at trykke på knapperne **"Fordom"** (venstre) og **"Virkelighed"** (højre) under kortet.
4. Efter svar vises feedback, indtil spilleren trykker "Næste" (ingen automatisk videre; teksterne er for lange til 2,5 sek):
   - Rigtigt: grøn markering + "Rigtigt." + kortets `forklaring`.
   - Forkert: neutral lys blå markering + "Ikke helt." + kortets `forklaring`. **Ingen rød farve, intet kryds.**
   - Kort med `svar: "begge"`: altid grøn markering, ingen "Rigtigt."/"Ikke helt.", kun `forklaring`. Tæller som rigtigt.
5. Efter kort 8 → bevis-skærm med resultatlinjen "Du ramte X ud af 8".

### Trækregler
- Kun kort med `aktiv: true` kan trækkes.
- Højst ét kort pr. `gruppe` (kort med samme gruppe siger det samme og må ikke komme i samme spil).
- Blandt de 8: mindst 2 og højst 4 kort med `svar` "virkelighed" eller "begge". Resten "fordom". Så kan spilleren ikke gætte sig til et mønster.
- Rækkefølgen er tilfældig.
- "Spil igen" i samme besøg foretrækker kort, spilleren ikke har set endnu (husk dem kun i hukommelsen, aldrig i storage, jf. K4). Når der ikke er nok usete, fyldes op med sete.
- Samme seed-mulighed som Spil 2 (`?seed=123`) styrer også trækningen.
- Puljen kan ikke garantere, at en spiller aldrig ser samme kort ved et senere besøg. Det kræver lagring, som K4 forbyder.

### Indhold (læg i `CONFIG.spil1.kort`)

Feltformat: `{ id, udsagn, svar: "fordom" | "virkelighed" | "begge", forklaring, gruppe?, aktiv, tjek? }`

**Fordomme**

| id | Udsagn | Svar | Forklaring | Gruppe | Aktiv | Tjek |
|---|---|---|---|---|---|---|
| f1 | HHX er den nemme vej til en studenterhue. | fordom | Samme adgangskrav. Samme hue. Samme adgang til videregående uddannelser. | adgang | ja | TODO-FAKTA: nuværende adgangskrav |
| f2 | På HHX skal du være totalt matematisk og nørdet. | fordom | Du får matematik. Du bruger det på priser, budgetter og regnskaber. | | ja | TODO-FAKTA: niveau og indhold i læreplanen |
| f3 | Du har kun valgt HHX, fordi du ikke vil have fysik og kemi. | begge | Og? Det er en god grund. | | ja | TODO-FAKTA: at ingen naturvidenskabelige fag er obligatoriske |
| f4 | Du skal på CBS, når du er færdig med HHX. | fordom | Jura, psykologi, lærer, sygeplejerske. HHX giver adgang til mere end økonomi. | | ja | TODO-FAKTA: adgangskrav for de nævnte uddannelser |
| f5 | For at starte på HHX skal du kunne C25-indekset. | fordom | Virksomhedsøkonomi og afsætning er nye fag for alle. Alle starter fra nul. | nyt-fag | ja | |
| f6 | HHX er kun for folk med lyseblå skjorter og designertasker. | fordom | Hver tredje gymnasieelev med faglærte forældre vælger HHX. | | ja | TODO-FAKTA: præcis formulering i AE's analyse |
| f7 | Du har kun valgt HHX, fordi du vil tjene mange penge. | begge | PLADSHOLDER: elevcitat | | **nej** | Aktiveres, når elevcitat findes |
| f8 | Elever på HHX har rundsave på albuerne. | fordom | PLADSHOLDER: elevcitat | | **nej** | Aktiveres, når elevcitat findes |
| f9 | EUX er for dem, der ikke kan klare gymnasiet. | fordom | Du får en gymnasial eksamen og en erhvervsuddannelse. Og adgang til videregående uddannelser. | | ja | TODO-FAKTA: formulering om studiekompetence på ug.dk eller i EUX-loven |
| f10 | På EUX sidder man bare på skolebænken. | fordom | Du kommer ud i en virksomhed og får løn. | eux-praktik | ja | TODO-FAKTA: praktik og elevløn i EUX Business |

**Virkelighed** (nødvendige, ellers er svaret altid "Fordom")

| id | Udsagn | Svar | Forklaring | Gruppe | Aktiv | Tjek |
|---|---|---|---|---|---|---|
| v1 | HHX giver adgang til universitetet. | virkelighed | HHX er en studentereksamen og giver adgang til videregående uddannelser. | adgang | ja | |
| v2 | Virksomhedsøkonomi er et nyt fag for alle. | virkelighed | Faget findes ikke i folkeskolen, så alle starter samme sted. | nyt-fag | ja | |
| v3 | HHX er en 3-årig gymnasial uddannelse. | virkelighed | Tre år. Studenterhue. Samme som de andre gymnasier. | | ja | |
| v4 | På EUX er du i praktik i en virksomhed og får løn. | virkelighed | Du kommer ud i en rigtig virksomhed og får elevløn. | eux-praktik | ja | TODO-FAKTA: praktik og elevløn |
| v5 | På HHX har du et andet fremmedsprog, fx spansk eller tysk. | virkelighed | Sprog er en del af HHX. Handel foregår ikke kun på dansk. | | ja | TODO-FAKTA: obligatorisk 2. fremmedsprog og udbudte sprog |
| v6 | Du vælger studieretning efter grundforløbet. | virkelighed | Du behøver ikke vide det hele fra dag ét. | | ja | TODO-FAKTA: tidspunkt for studieretningsvalg |

Aktiv pulje: 7 fordom, 1 begge, 6 virkelighed. Med grupperne kan der altid trækkes 8 kort, der opfylder reglerne.

## 6. Spil 2: "Slikboden"

### Fortælling
"Du driver en slikbod på messen i 2 dage. Se dagens nyhed, og vælg pris, indkøb og markedsføring. Hvor meget tjener du?"

### Mekanik
1. Intro-skærm med fortællingen + knap "Åbn boden".
2. **2 runder** (Dag 1 og Dag 2). Hver runde = én skærm:
   - Øverst: **Dagens nyhed** (hændelsens tekst), fx "En skoleklasse med lommepenge kommer forbi." Hændelsen vises **før** valget, så valget giver mening.
   - Tre valg (segmenterede knapper, ét valg pr. række, forvalgt: midterste mulighed):

| Valg | Muligheder |
|---|---|
| Pris pr. pose | 5 kr · 10 kr · 15 kr |
| Indkøb | 20 · 40 · 60 poser (indkøbspris 4 kr/stk) |
| Markedsføring | Intet (0 kr) · Håndskrevet skilt (20 kr) · Opslag på SoMe (50 kr) |

   Knap: "Åbn boden for i dag".
3. Kort "dagen går"-animation (max 1,5 sek): en tæller for solgte poser løber op.
4. **Dagsresultat-skærm**:
   - Kunder der ville købe, solgte poser, omsætning, udgifter, overskud.
   - **Én** forklaringslinje (den første, der passer, efter reglerne nedenfor).
   - Knap: "Næste dag" / "Se resultat".
5. Efter Dag 2 → afslutningsskærm:
   - "Dit samlede overskud: X kr" (kan være negativt; vis det neutralt, fx "Underskud: 40 kr").
   - Læringslinje: "Pris, lager og markedsføring. Det er afsætning og virksomhedsøkonomi. Det har du på HHX og EUX."
   - Knap "Vis bevis" (orange) → bevis-skærm med resultatlinjen "Dit overskud: X kr" (eller "Dit underskud: X kr").

### Model (læg alle tal i `CONFIG.spil2`)

Hændelsernes faktor afhænger af prisen. Det er det, der gør, at den bedste opskrift skifter fra dag til dag.

```
grundefterspørgsel = { 5: 55, 10: 40, 15: 25 }      // kunder pr. dag ved prisen
markedsføring      = { intet: {pris:0,  faktor:1.00},
                       skilt: {pris:20, faktor:1.25},
                       some:  {pris:50, faktor:1.40} }
indkøbspris        = 4                              // kr pr. pose
hændelser = [
  { tekst: "Solskin. Mange gæster i dag.",                      faktor: {5:1.25, 10:1.25, 15:1.25} },
  { tekst: "Regnvejr. Færre gæster i dag.",                     faktor: {5:0.75, 10:0.75, 15:0.75} },
  { tekst: "Almindelig dag på messen.",                         faktor: {5:1.00, 10:1.00, 15:1.00} },
  { tekst: "En skoleklasse med lommepenge kommer forbi.",       faktor: {5:1.40, 10:1.10, 15:0.70} },
  { tekst: "Konkurrenten ved siden af giver gratis slik.",      faktor: {5:1.00, 10:0.80, 15:0.60} },
  { tekst: "Forældredag. Mange voksne med penge på lommen.",    faktor: {5:0.90, 10:1.10, 15:1.50} }
]

efterspørgsel = round( grundefterspørgsel[pris] * markedsføring.faktor * hændelse.faktor[pris] )
solgt         = min( indkøb, efterspørgsel )
omsætning     = solgt * pris
udgifter      = indkøb * indkøbspris + markedsføring.pris
overskud      = omsætning - udgifter
usolgt        = indkøb - solgt          // går tabt
forgæves      = efterspørgsel - solgt   // kunder uden varer
```

- Hændelse vælges tilfældigt pr. dag, men **Dag 1 og Dag 2 må ikke få samme hændelse**.
- Seed-mulighed (`?seed=123` i URL) til test, så resultater kan reproduceres. Uden seed: `Math.random`.

**Forventet balance** (forhåndsberegnet; `balance.js` skal bekræfte den):

| Hændelse | Bedste opskrift | Overskud | 10 kr / 40 / skilt |
|---|---|---|---|
| Solskin | 15 kr / 40 / skilt | 405 | 220 |
| Regnvejr | 15 kr / 20 / intet | 205 | 200 |
| Almindelig | 15 kr / 40 / SoMe | 315 | 220 |
| Skoleklasse | 10 kr / 60 / SoMe | 310 | 220 |
| Konkurrent | 10 kr / 40 / skilt | 220 | 220 |
| Forældredag | 15 kr / 60 / SoMe | 505 | 220 |

5 kr giver aldrig over 60 kr. Det er bevidst: lav pris, høj omsætning, næsten ingen fortjeneste. Forklaringslinje 1 gør pointen tydelig.

### Forklaringslinje (prioriteret, vis den første, der passer)

Hjælpestørrelser:
- `solgtUden` = min(indkøb, round(grundefterspørgsel[pris] × hændelse.faktor[pris])) // samme dag uden markedsføring
- `ekstraSolgt` = solgt − solgtUden
- `ekstraKunder` = efterspørgsel − round(grundefterspørgsel[pris] × hændelse.faktor[pris])

Regler:
1. `pris = 5` → "Du solgte {solgt} poser, men tjente kun 1 kr pr. pose. Lav pris kræver kæmpe salg."
2. `forgæves >= 5` → "Du løb tør. {forgæves} kunder gik forgæves. Køb mere ind næste gang?"
3. `usolgt >= 10` → "Du købte {usolgt} poser for meget. De blev for gamle."
4. Markedsføring ≠ intet og `ekstraSolgt × pris < mf.pris` → "Markedsføringen kostede mere, end den gav."
5. Markedsføring ≠ intet ellers → "Markedsføringen gav {ekstraKunder} ekstra kunder for {mf.pris} kr."
6. `pris = 15` → "Høj pris giver færre kunder. Men mere pr. pose."
7. Fallback → "God balance mellem pris og lager."

Regel 4 regner på **solgte** ekstra poser, ikke ekstra kunder. Var lageret allerede tomt, giver flere kunder ingen penge. Indkøbet er det samme med og uden markedsføring, så omsætningen fra de ekstra solgte poser sammenlignes direkte med markedsføringens pris.

### Balancekrav (verificér med `test/balance.js`)
Scriptet udskriver overskud for alle 27 kombinationer × 6 hændelser og fejler (exit-kode 1), hvis et krav ikke er opfyldt:
- B1: Ingen kombination er bedst på alle hændelser. Mindst 4 forskellige kombinationer er bedst på mindst én hændelse.
- B2: Både 10 kr og 15 kr er bedste pris på mindst 2 hændelser hver.
- B3: Mindst 2 forskellige markedsføringsvalg er en del af en bedste kombination.
- B4: På hver hændelse er den bedste højst 25 % bedre end den næstbedste.
- B5: "Fornuftig spiller" (10 kr, 40 poser, skilt) giver overskud på alle hændelser.
- B6: Underskud er muligt på mindst én hændelse.

Justér **kun** `CONFIG`-tal, hvis kravene ikke er opfyldt, og rapportér justeringerne.

## 7. CONFIG-skabelon

```js
const CONFIG = {
  afsender: {
    produkter: "HHX · EUX",
    linje: "Tæt på dig. Tæt på virkeligheden.",
    skole: "Handelsgymnasiet Vestfyn"
  },
  spil1: { antal: 8, minVirkelighed: 2, maxVirkelighed: 4, kort: [ /* se tabeller i afsnit 5 */ ] },
  spil2: { /* se model i afsnit 6 */ }
};
```

## 8. Filstruktur

```
messespil/
  index.html          // hele produktet (leveres)
  test/
    balance.js        // balancetest af Spil 2 (Node). Læser CONFIG fra index.html, så der kun er én kilde.
    e2e.spec.js       // Playwright-test (se nedenfor)
    screenshots/
  README.md           // hvordan man ændrer kort og tal, hvordan man hoster, og standguiden (afsnit 10)
  STANDGUIDE.md       // én side til standpersonalet, kan printes
```

## 9. Test og accept

Kør i mobil-viewport (iPhone 13 og Pixel 7 i Playwright):

- [ ] Startskærm → Spil 1 → 8 kort via knapper → bevis-skærm med korrekt "X ud af 8".
- [ ] Spil 1 kan også gennemføres med swipe (simulér pointer-drag).
- [ ] Spil 1: over 200 trækninger med forskellige seeds overholder alle trækregler (8 kort, kun aktive, maks. ét pr. gruppe, 2–4 virkelighed/begge).
- [ ] Spil 1: "Spil igen" i samme besøg giver kun sete kort, når de usete er brugt op.
- [ ] Kort med `svar: "begge"` tæller som rigtigt uanset swiperetning.
- [ ] Startskærm → Spil 2 → 2 dage → afslutning → bevis-skærm med overskud.
- [ ] Spil 2: dagens nyhed vises på valgskærmen før "Åbn boden for i dag".
- [ ] Dag 1 og Dag 2 har forskellige hændelser.
- [ ] Bevis-skærmen viser et ur, der ændrer sig mellem to aflæsninger med 1,5 sek mellemrum, og har kørende animation.
- [ ] Bevis-skærmen kan ikke nås direkte via URL.
- [ ] "Spil igen" nulstiller alt.
- [ ] Ingen netværkskald efter load (tjek i Playwright: blokér netværk efter load og gennemfør begge spil).
- [ ] Ingen cookies/localStorage/sessionStorage skrives.
- [ ] Filstørrelse < 300 KB.
- [ ] Kontrast AA på alle tekst/baggrund-par (kør axe-core i testen).
- [ ] `balance.js` opfylder B1–B6.
- [ ] Ingen forekomst af "vind", "vundet", "PLADSHOLDER" eller tankestreger i synlig UI-tekst.

Tag skærmbilleder af alle skærme i 390×844 og gem dem i `test/screenshots/`, så Jakob kan gennemse dem.

## 10. Hosting, QR og afvikling på dagen (README-indhold)

**Hosting og QR**
- `index.html` hostes statisk (fx GitHub Pages eller Netlify).
- QR-koden peger på en **redirect-URL, som skolen selv styrer**, så destinationen kan ændres uden nyt tryk. Redirecten sættes op én gang og røres ikke på messedagen.
- Én gang før første messe: test på egen telefon på 4G (ikke wifi), både iPhone og Android.

**Afvikling på dagen (intet skal ændres)**
- Hav en iPad ved standen med spillet indlæst som plan B.
- Læg `STANDGUIDE.md` printet på standen. Indhold:
  1. "Gyldigt bevis: blå skærm, grønt flueben der pulserer, og et ur der går. Klokken passer med din egen."
  2. "Står uret stille, eller er klokken forkert, er det et skærmbillede. Bed dem spille spillet. Det tager to minutter."
  3. "Én pose pr. person."
  4. "Virker QR-koden ikke? Lad dem spille på iPad'en."
  5. "Er poserne væk, må de gerne spille alligevel."

## 11. Uden for scope

- Ingen highscore, leaderboard, deling til SoMe, login eller backend.
- Ingen lyd.
- Ingen logo-grafik.
- Ingen dagskode.
