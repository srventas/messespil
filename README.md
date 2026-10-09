# Messespil (HHX · EUX)

Mobilspil til uddannelsesmesser. Besøgende scanner en QR-kode, gennemfører et af to spil og viser bevis-skærmen ved standen for at få en mulepose. Hele produktet er én fil: `index.html`.

Specifikation: [BUILD-messespil.md](BUILD-messespil.md). Til standpersonalet: [STANDGUIDE.md](STANDGUIDE.md).

## Ret indhold

Alt indhold står i `CONFIG` øverst i `<script>` i `index.html`. Logikken nedenfor skal ikke røres.

- **Skolenavn og linjer:** `CONFIG.afsender`.
- **Kort i Fordom eller virkelighed:** `CONFIG.spil1.kort`. Hvert kort har:
  - `udsagn`: teksten på kortet.
  - `svar`: `"fordom"`, `"virkelighed"` eller `"begge"` (tæller som rigtigt uanset svar).
  - `forklaring`: vises efter svar.
  - `gruppe` (valgfri): kort med samme gruppe kommer aldrig i samme spil. Brug det, når to kort siger det samme.
  - `aktiv`: sæt til `false` for at slå et kort fra. Fx fordom f7 og f8, til elevcitaterne findes.
  - `tjek`: din egen note. Vises ikke.
- **Trækning:** `antal` (8), `minVirkelighed` og `maxVirkelighed`. Puljen skal kunne give 8 kort inden for reglerne. Ellers viser spillet en fejl, og testen fanger det.
- **Slikboden:** `CONFIG.spil2`. Ændrer du tal, så kør balancetesten (se nedenfor).

Ingen tankestreger (– eller —) og ikke ordene "vind" eller "vundet" i teksterne. Testen fejler, hvis de dukker op.

Kortene markeret `TODO-FAKTA` i `tjek` skal faktatjekkes før brug.

## Test

Kræver Node 18 eller nyere.

```
npm install
node test/balance.js      # balancen i Slikboden (B1 til B6)
npx playwright test       # hele spillet i iPhone 13- og Pixel 7-format
```

Playwright gemmer skærmbilleder af alle skærme i `test/screenshots/` (390×844).

Begge Playwright-profiler kører i Chromium. iPhone-profilen tester iPhones skærmstørrelse og touch, ikke Safari. Test derfor også på en rigtig iPhone.

`?seed=123` i adressen gør trækning af kort og hændelser forudsigelig. Det er kun til test.

## Hosting

`index.html` kan hostes statisk hvor som helst. Med GitHub Pages: Settings → Pages → Deploy from a branch → `main` / root. Filen ligger så på `https://<bruger>.github.io/messespil/`.

- QR-koden skal pege på en **redirect-URL, som skolen selv styrer**, fx `vestfynedu.dk/messespil`, ikke direkte på GitHub Pages. Så kan destinationen ændres uden nyt tryk.
- Redirecten sættes op én gang. Intet skal ændres eller deployes før en messedag.
- Test én gang før første messe på egen telefon på 4G (ikke wifi), både iPhone og Android.

## Data og GDPR

Spillet gemmer intet: ingen cookies, ingen localStorage, ingen analytics, ingen formularer. Efter indlæsning sender det ingen netværkskald.

Hosting-udbyderen (fx GitHub) logger dog IP-adresser i sine serverlogs, når siden hentes. Det er standard for alle websider. Spørger nogen, er det det korrekte svar, ikke "nul data".

## Afvikling på dagen

Se [STANDGUIDE.md](STANDGUIDE.md). Print den og læg den på standen. Hav en iPad med spillet indlæst som plan B.
