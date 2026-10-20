# Byggeinstruktion: Messespil til uddannelsesmesse (HHX | EUX)

Denne fil er en komplet specifikation til Claude Code. Byg præcis det, der står her. Hvor noget er markeret `TODO-FAKTA`, er værdien ikke endeligt tjekket og rettes senere af Jakob. Byg med værdien, som den står.

**Version 3.** Ændringer i forhold til version 2:
- Fordomme opdateret efter "Fordomme HHX/EUX uddannelsesmesse", udkast v3 (8. oktober 2026). Separator mellem HHX og EUX er pipe: "HHX | EUX".
- Slikboden er bygget om: hver runde er et tilfældigt scenarie, og det bedste valg følger af scenariet. Boden er tegnet, og tegningen følger valgene.
- Linjen "Tæt på dig. Tæt på virkeligheden." er erstattet af "Virkelighedsnært. Virksomhedsnært." (muleposernes sprog).
- Orange bruges kun med hvid tekst (bevidst valg, se afsnit 3).
- "Virkelighed" er omdøbt til "sandhed" i Spil 1. Kortene kommer fra fordomme_samlet.pdf.

Ændringer i version 2 i forhold til version 1:
- Spil 1 trækker 8 tilfældige kort fra en pulje i stedet for 8 faste kort.
- Slikbodens model er ombygget, så ingen opskrift vinder hver gang. Dagens hændelse vises nu før valget.
- Kravet om intet skolenavn er droppet.
- Dagskoden er erstattet af et tidsstempel på bevis-skærmen, så intet skal ændres eller deployes på messedagen.
- "Spil 3" hedder nu "Spil 2".

---

## 1. Formål og kontekst

- Et lille mobilspil, som besøgende ved en messestand åbner via en QR-kode.
- Når et spil er gennemført, vises en **bevis-skærm**, som spilleren viser ved standen og får udleveret en mulepose.
- Målgruppe: elever i 8.–10. klasse (14–16 år), på egen telefon, stående ved en stand med dårlig dækning.
- Branding: "HHX", "EUX", linjen "Virkelighedsnært. Virksomhedsnært." (fra `CONFIG.afsender.linje`) og skolens navn (fra `CONFIG.afsender.skole`).
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
| K9 | Tilgængelighed: alt kan betjenes med knapper (swipe er en genvej, ikke eneste vej), tekst min. 18 px, kontrast mindst WCAG AA, `prefers-reduced-motion` respekteres (animationer dæmpes, men bevis-animationen må stadig pulsere langsomt). |
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
- Orange bruges aldrig som fladebaggrund, kun på CTA-knapper, og **kun med hvid tekst**. Det er et bevidst designvalg: hvid på orange har kontrast 2,85:1 og består ikke WCAG AA (kræver 3:1 for stor tekst). Axe-testen undtager derfor kun CTA-knapperne fra kontrastreglen. Alle andre par skal bestå AA.
- Forkert svar markeres **ikke** med rødt eller kryds. Brug neutral navy/lys blå.

**Typografi:** Systemfont-stack (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`). Fed, stor, rund og venlig. Brandfonten Nudista må ikke indlejres (licens uafklaret).

**Stil:** Rent, fladt, store touch-flader (min. 48 px høje knapper), runde hjørner (12–16 px), korte overgange (150–250 ms). Ingen emojis i UI-tekst.

## 4. Skærmflow

```
[Startskærm] ─┬─> [Spil 1: Fordom eller sandhed?]    ─┐
              └─> [Spil 2: Slikboden] ─────────────────┴─> [Bevis-skærm]
```

### 4.1 Startskærm
- Øverst: "HHX | EUX" (lille, navy). Separator er altid pipe `|`, aldrig prik.
- Overskrift: "Spil og hent din pose"
- Undertekst: "Vælg et spil. Det tager under to minutter."
- To store valgkort (kan trykkes):
  - **Fordom eller sandhed?**: "8 udsagn. Swipe dem på plads." ca. 1 min
  - **Slikboden**: "Læs situationen, og sæt boden op. Træf de gode valg." ca. 2 min
- Nederst, lille: `CONFIG.afsender.skole`.

### 4.2 Bevis-skærm (fælles afslutning)
- Baggrund `#004998`, hvid tekst.
- **Midt på skærmen og størst** (30 px fed, navy tekst i hvid boks): "Gå til standen, og vis skærmen. Så får du din pose." Over den: flueben, "Gennemført!" og resultatlinjen.
- Stort animeret flueben (SVG, tegnes ind og pulserer derefter langsomt i en uendelig løkke).
- Overskrift: "Gennemført!"
- Resultatlinje fra spillet (fx "Du ramte 6 ud af 8" eller "5 af 6 gode valg. Overskud: 820 kr").
- **Tidsstempel** under instruksen, hvid tekst direkte på blå baggrund: "Gennemført kl. 14:32, tirsdag 20. oktober". Sættes én gang, når spillet gennemføres, og står derefter stille (et tikkende ur forvirrede). Skriftstørrelsen er mindre end instruksen. Standpersonalet tjekker, at tidspunktet er fra i dag og inden for de sidste 15 minutter, og at fluebenet pulserer.
- Nederst: `CONFIG.afsender.linje`, "HHX | EUX" og `CONFIG.afsender.skole`.
- Knap (sekundær, diskret): "Spil igen" → startskærm.
- Bevis-skærmen må ikke kunne nås via URL-hash, query-parameter eller direkte link; kun ved at gennemføre et spil.

## 5. Spil 1: "Fordom eller sandhed?"

### Mekanik
1. Kort intro (én skærm): "Er det en fordom eller en sandhed? Swipe til venstre for fordom, til højre for sandhed." Knap: "Start".
2. Spillet trækker **8 kort** fra puljen `CONFIG.spil1.kort` efter trækreglerne nedenfor og viser ét ad gangen. Fremskridt vises som "3/8" eller prikker.
3. Spilleren svarer ved:
   - at swipe kortet til venstre (Fordom) eller højre (Sandhed). Kortet følger fingeren og roterer let; svar registreres ved > 35 % af bredden, ellers snapper det tilbage,
   - eller at trykke på knapperne **"Fordom"** (venstre) og **"Sandhed"** (højre) under kortet.
4. Efter svar vises feedback, indtil spilleren trykker "Næste" (ingen automatisk videre; teksterne er for lange til 2,5 sek):
   - Rigtigt: grøn markering + "Rigtigt." + kortets `forklaring`.
   - Forkert: neutral lys blå markering + "Ikke helt." + kortets `forklaring`. **Ingen rød farve, intet kryds.**
   - Kort med `svar: "begge"`: altid grøn markering, ingen "Rigtigt."/"Ikke helt.", kun `forklaring`. Tæller som rigtigt.
5. Efter kort 8 → bevis-skærm med resultatlinjen "Du ramte X ud af 8".

### Trækregler
- Kun kort med `aktiv: true` kan trækkes.
- Højst ét kort pr. `gruppe` (kort med samme gruppe siger det samme og må ikke komme i samme spil).
- Blandt de 8: mindst 2 og højst 4 kort med `svar` "sandhed" eller "begge". Resten "fordom". Så kan spilleren ikke gætte sig til et mønster.
- Rækkefølgen er tilfældig.
- "Spil igen" i samme besøg foretrækker kort, spilleren ikke har set endnu (husk dem kun i hukommelsen, aldrig i storage, jf. K4). Når der ikke er nok usete, fyldes op med sete.
- Samme seed-mulighed som Spil 2 (`?seed=123`) styrer også trækningen.
- Puljen kan ikke garantere, at en spiller aldrig ser samme kort ved et senere besøg. Det kræver lagring, som K4 forbyder.

### Indhold (læg i `CONFIG.spil1.kort`)

Kilde: `fordomme_samlet.pdf` (9 fordomskort med fordom på forsiden og sandhed på bagsiden). Teksterne er gengivet ordret fra kortene.

Feltformat: `{ id, udsagn, svar: "fordom" | "sandhed" | "begge", forklaring, gruppe, aktiv, tjek? }`

**Fordomme** (forklaring = kortets bagside, vises under etiketten "Sandheden")

| id | Fordom | Svar | Sandhed (bagside) | Gruppe | Tjek |
|---|---|---|---|---|---|
| f1 | HHX er den nemme vej til en studenterhue. | fordom | HHX har samme adgangskrav. Samme mængde timer. Samme antal eksaminer. | p1 | TODO-FAKTA: adgangskrav, timetal og eksaminer |
| f2 | På HHX skal du være matematisk og nørdet. | fordom | Du får matematik, ja. Du får bare det, der kan bruges i virkeligheden. | p2 | TODO-FAKTA: læreplan |
| f3 | Du har kun valgt HHX, fordi du ikke vil have fysik og kemi. | begge | Ja. Og? | p3 | TODO-FAKTA: ingen obligatoriske naturfag |
| f4 | Du skal læse økonomi eller være revisor, når du er færdig med HHX. | fordom | Jura, psykologi, lærer, sygeplejerske. HHX giver adgang til mere end økonomi. | p4 | TODO-FAKTA: adgangskrav |
| f5 | De nye fag er svære, og man skal vide en masse om virksomheder. | fordom | Virksomhedsøkonomi og afsætning er nye fag for alle. Alle starter fra nul. | p5 | |
| f6 | HHX er kun for folk med lyseblå skjorter, dyre sko og designertasker. | fordom | Der er flere hvide sokker i Birkenstocks end der er jakkesæt. | p6 | |
| f7 | EUX er for dem, der ikke kan klare gymnasiet. | fordom | Du skal kunne bestå gymnasiet på kun 2 år og får adgang til videregående uddannelse oveni. | p7 | TODO-FAKTA: EUX Business |
| f8 | Du har kun valgt HHX, fordi du vil tjene mange penge. | begge | Det er jo ikke dårligt at have ambitioner. | p8 | |
| f9 | Elever på HHX er snobbede. | fordom | Der er forskel på at klæde sig snobbet og være en snob. Vi er ikke snobber på hhx. | p9 | |

f3 og f8 tager fordommen på sig i stedet for at afvise den. De tæller derfor som rigtige, uanset hvilken vej man swiper.

**Sandheder som selvstændige udsagn** (nødvendige, ellers er svaret altid "Fordom")

Sandheder fra kortenes bagside, der giver mening uden fordommen foran. "Ja. Og?", hvide sokker, ambitioner og snobber er udeladt, fordi de kun virker som svar. Forklaringen viser fordommen, sandheden svarer på. Hver sandhed deler gruppe med sin fordom, så de to aldrig kommer i samme spil.

| id | Udsagn | Gruppe | Note |
|---|---|---|---|
| s1 | HHX har samme adgangskrav. Samme mængde timer. Samme antal eksaminer. | p1 | Ordret |
| s2 | På HHX får du matematik, der kan bruges i virkeligheden. | p2 | Omskrevet, så det kan stå alene |
| s4 | Jura, psykologi, lærer, sygeplejerske. HHX giver adgang til mere end økonomi. | p4 | Ordret |
| s5 | Virksomhedsøkonomi og afsætning er nye fag for alle. Alle starter fra nul. | p5 | Ordret |
| s7 | På EUX skal du kunne bestå gymnasiet på kun 2 år og får adgang til videregående uddannelse oveni. | p7 | "På EUX" tilføjet |

Aktiv pulje: 7 fordom, 2 begge, 5 sandhed i 9 grupper. Trækningen bruger en søgning, der går tilbage, når et valg låser resten, så den altid finder 8 kort, der opfylder reglerne.

## 6. Spil 2: "Slikboden"

### Idé
Hver runde giver spilleren en tilfældig situation: et sted, en kundegruppe, et antal gæster og et vejr. Spilleren læser situationen og sætter boden op. Det bedste valg følger af situationen, så "kriterierne" skifter med scenariet, men kan altid læses ud af teksten. Det er ikke et gættespil.

### Mekanik
1. Intro-skærm med tegning af boden, fortællingen og knappen "Åbn boden".
2. **2 runder.** De to runder har altid forskellige kundegrupper. Hver runde = én skærm:
   - Scenariekort: sted (overskrift), kundegruppens beskrivelse, antal gæster og vejr.
   - Tegning af boden, der følger valgene: prisskiltet viser prisen, hylden viser én pose pr. 10 indkøbte, og foran boden står et skilt eller en telefon med et like, alt efter markedsføringen.
   - Tre valg (segmenterede knapper). **Intet er forvalgt.** "Åbn boden" er deaktiveret, til alle tre er valgt, og en linje siger, hvad der mangler. Når alt er valgt, vises dagens udgifter.

| Valg | Muligheder |
|---|---|
| Pris pr. pose | 10 kr / 15 kr / 20 kr |
| Indkøb | 20 / 40 / 60 / 80 poser (5 kr/stk) |
| Markedsføring | Intet (0 kr) / Skilt (20 kr) / SoMe-opslag (50 kr) |

3. "Boden er åben" (max 1,5 sek): kunder går hen til boden, poserne forsvinder fra hylden, og en tæller for solgte poser løber op. Med `prefers-reduced-motion` vises slutresultatet med det samme.
4. **Rundens resultat:** tegning af boden med de usolgte poser, tal (kunder, solgte poser, omsætning, udgifter, overskud) og tre vurderinger, én pr. valg:
   - Godt valg: grøn boks, "Pris: 15 kr. Godt valg." + forklaring.
   - Ikke godt: lys blå boks, "Pris: 10 kr. Bedst: 20 kr." + forklaring. **Ingen rød farve, intet kryds.**
   - Pris og markedsføring forklares med kundegruppens tekst. Indkøb forklares med tal: "Du løb tør. 12 kunder gik forgæves." eller "9 poser blev ikke solgt."
   - Var markedsføring spildt, fordi boden blev udsolgt alligevel, siges det direkte i stedet for gruppens tekst.
5. Afslutning: "Gode valg: X af 6", overskud pr. runde og samlet, læringslinjen og "Vis bevis" (orange).
6. Bevis-skærm med resultatlinjen "X af 6 gode valg. Overskud: Y kr" (eller "Underskud: Y kr").

### Model (alt i `CONFIG.spil2`)

```
scenarie      = tilfældig kundegruppe + tilfældigt sted fra gruppen + tilfældigt antal + tilfældigt vejr
efterspørgsel = round( antal.kunder × vejr.faktor × gruppe.pris[pris] × gruppe.mf[markedsføring] )
solgt         = min( indkøb, efterspørgsel )
omsætning     = solgt × pris
udgifter      = indkøb × 5 + markedsføringens pris
overskud      = omsætning − udgifter
```

| Kundegruppe | Pris-faktor 10 / 15 / 20 kr | Markedsføring intet / skilt / SoMe | Typisk bedst |
|---|---|---|---|
| Børn med lommepenge | 1,40 / 0,50 / 0,25 | 1,00 / 1,30 / 1,00 | 10 kr, skilt |
| Unge på telefonen | 1,20 / 1,00 / 0,50 | 1,00 / 1,00 / 1,60 | 15 kr, SoMe |
| Voksne, der betaler for kvalitet | 1,00 / 1,00 / 0,85 | 1,00 / 1,35 / 1,10 | 20 kr, skilt |
| Sultne fans ved indgangen | 1,10 / 1,00 / 0,55 | 1,00 / 1,00 / 1,00 | 15 kr, intet |

Antal gæster: 25, 40 eller 55. Vejr: almindeligt (1,0), regn (0,8) eller sol (1,2). Det giver 36 talmæssigt forskellige scenarier og 72 med stederne.

### Hvad er et "godt valg"?
Spillet regner alle 36 kombinationer igennem for scenariet (`godGraense` = 0,9):
- **Pris** er god, hvis den bedste kombination med den pris giver mindst 90 % af det bedst mulige overskud.
- **Markedsføring** vurderes på samme måde.
- **Indkøb** vurderes ud fra spillerens egen pris og markedsføring: godt, hvis det giver mindst 90 % af det bedste indkøb med de valg. Så straffes man ikke to gange for en forkert pris.

### Kvalitetskrav (verificér med `test/scenarier.js`)
Scriptet læser `CONFIG` og modellen fra `index.html`, gennemregner alle scenarier og fejler (exit-kode 1), hvis et krav ikke er opfyldt:
- S1: Hver pris, hvert indkøb og hvert markedsføringsvalg er det bedste i mindst ét scenarie.
- S2: Kundegruppen afgør pris og markedsføring. For hver gruppe er samme pris bedst i mindst 75 % af gruppens scenarier, og mindst 3 grupper har hver sin typiske pris. Det samme for markedsføring med mindst 2 forskellige.
- S3: I intet scenarie er mere end én parameter ligegyldig (alle muligheder gode).
- S4: Det bedste valg giver altid overskud.
- S5: Underskud er muligt med dårlige valg.

Justér kun `CONFIG`-tal, hvis kravene ikke er opfyldt.

## 7. CONFIG-skabelon

```js
const CONFIG = {
  afsender: {
    produkter: "HHX | EUX",
    linje: "Virkelighedsnært. Virksomhedsnært.",
    skole: "Det Blå Gymnasium Vestfyn"
  },
  spil1: { antal: 8, minSandhed: 2, maxSandhed: 4, kort: [ /* se tabeller i afsnit 5 */ ] },
  spil2: { /* se model i afsnit 6 */ }
};
```

## 8. Filstruktur

```
messespil/
  index.html          // hele produktet (leveres)
  test/
    scenarier.js      // kvalitetstest af Slikbodens scenarier (Node). Læser CONFIG og modellen fra index.html.
    e2e.spec.js       // Playwright-test (se nedenfor)
    screenshots/
  README.md           // hvordan man ændrer kort og tal, hvordan man hoster, og standguiden (afsnit 10)
  STANDGUIDE.md       // én side til standpersonalet, kan printes
```

## 9. Test og accept

Kør i mobil-viewport (iPhone 13 og Pixel 7 i Playwright):

- [ ] Startskærm → Spil 1 → 8 kort via knapper → bevis-skærm med korrekt "X ud af 8".
- [ ] Spil 1 kan også gennemføres med swipe (simulér pointer-drag).
- [ ] Spil 1: over 1000 trækninger med forskellige seeds overholder alle trækregler (8 kort, kun aktive, maks. ét pr. gruppe, 2–4 sandhed/begge).
- [ ] Spil 1: "Spil igen" i samme besøg giver kun sete kort, når de usete er brugt op.
- [ ] Kort med `svar: "begge"` tæller som rigtigt uanset swiperetning.
- [ ] Startskærm → Spil 2 → 2 runder → afslutning → bevis-skærm med "X af 6 gode valg. Overskud: Y kr".
- [ ] Spil 2: "Åbn boden" er deaktiveret, til pris, indkøb og markedsføring er valgt. Intet er forvalgt.
- [ ] Spil 2: de to runder har forskellige kundegrupper.
- [ ] Spil 2: det bedste valg i begge runder giver 6 af 6 og det bedst mulige overskud.
- [ ] Spil 2: vurderingerne er kun grønne eller lys blå, aldrig røde.
- [ ] Bevis-skærmen viser instruksen midt på skærmen i en hvid boks og i større skrift end tidsstemplet. Tidsstemplet står stille, og fluebenet har kørende animation.
- [ ] Bevis-skærmen kan ikke nås direkte via URL.
- [ ] "Spil igen" nulstiller alt.
- [ ] Ingen netværkskald efter load (tjek i Playwright: blokér netværk efter load og gennemfør begge spil).
- [ ] Ingen cookies/localStorage/sessionStorage skrives.
- [ ] Filstørrelse < 300 KB.
- [ ] Kontrast AA på alle tekst/baggrund-par (kør axe-core i testen).
- [ ] `scenarier.js` opfylder S1–S5.
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
  1. "Gyldigt bevis: blå skærm, grønt flueben der pulserer, og et tidsstempel fra i dag inden for de sidste 15 minutter."
  2. "Står fluebenet stille, eller er tidspunktet gammelt, er det et skærmbillede. Bed dem spille spillet. Det tager to minutter."
  3. "Én pose pr. person."
  4. "Virker QR-koden ikke? Lad dem spille på iPad'en."
  5. "Er poserne væk, må de gerne spille alligevel."

## 11. Uden for scope

- Ingen highscore, leaderboard, deling til SoMe, login eller backend.
- Ingen lyd.
- Ingen logo-grafik.
- Ingen dagskode.
