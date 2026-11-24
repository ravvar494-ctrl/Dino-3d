# 🦖 DINO 3D: EVOLUTION RUNNER

W pełni trójwymiarowa, rozbudowana wersja kultowej gry z przeglądarki Chrome z zaawansowanym systemem levelowania (in-run roguelite) oraz stałą meta-progresją (Drzewko Ewolucji DNA i Skórki).

---

## 🌟 Główne Cechy Gry

1. **Grafika 3D i Proceduralne Modele (Three.js)**:
   - W pełni animowany model T-Rexa z kośćmi nóg, ogona, pyska i rąk.
   - Płynny bieg, skoki, wślizgi i obroty w 3 wymiarach.
   - Dynamiczne oświetlenie ze zmiennymi cieniami, cząsteczkami kurzu, dymu i odłamków.
   - 3 dynamiczne perspektywy kamery: **Kamera Śledząca 3D**, **Klasyczna 2.5D Retro**, oraz **Pierwszoosobowa FPV**!

2. **Podwójny Zaawansowany System Levelowania**:
   - **Poziom Biegu (In-Run Roguelite Perk System)**:
     - W trakcie biegu zbierasz punkty doświadczenia (XP) za pokonany dystans, omijanie przeszkód i zbieranie bursztynu DNA.
     - Każdy awans (Poziom 2, 3, 4...) zatrzymuje akcję i prezentuje **wybór 1 z 3 losowych mutacji/perków**:
       - *Chitynowa Regeneracja* (naprawa tarczy)
       - *Sejsmiczne Lądowanie* (niszczenie kaktusów falą uderzeniową)
       - *Dylatacja Czasu* (spowolnienie przeszkód przy zachowaniu punktacji)
       - *Turbosprężarka* (krótszy cooldown sprintu)
       - *Podwójny Skok*
       - *Drugi Oddech* (uratowanie przed śmiercią)
       - *Bursztynowa Gorączka* (podwójna waluta)
       - i wiele innych!
   - **Poziom Konta i Laboratorium DNA (Meta-Progression)**:
     - Po każdym biegu otrzymujesz XP profilu oraz zebrany Bursztyn DNA (zapisywane trwale w `localStorage`).
     - **Drzewko Talentów**: Inwestuj bursztyn w stałe wzmocnienia:
       - *Skorupa Chitynowa* (rozpoczynanie biegów z tarczami ochronnymi)
       - *Magnetyczny Ryk* (przyciąganie bursztynu na odległość)
       - *Skoczne Ścięgna* (odblokowanie i wzmocnienie podwójnego skoku)
       - *Błyskawiczny Sprint* (skrócenie czasu odnowienia i niszczenie przeszkód)
       - *Szybki Metabolizm* (+15% do +75% bonusowego XP)
       - *Pradawna Żyła* (szansa na podwójny/potrójny bursztyn)
       - *Zwinny Spadek* (szybkie lądowanie w dół w powietrzu)
       - *Szał Apex Rexa* (stały wyższy mnożnik punktów)
     - **Ewolucyjne Skórki Dino**:
       - *Dino Klasyczny* (wzorowany na oryginale)
       - *Raptor Pustynny* (+5% prędkości)
       - *Cyber Rex 2077* (radar na bursztyn i neonowe obwody)
       - *Wulkaniczny Tytan* (+1s do sprintu i płonąca skóra)
       - *Kosmiczny Lewiatan* (+10% mnożnika i gwiezdna powłoka)

3. **System Biomów i Środowiska**:
   - **Pustynia Prehistoryczna** (0 – 1000m): Ciepłe piaski, klasyczne kaktusy, pterodaktyle.
   - **Wulkaniczny Wąwóz** (1000 – 2000m): Ciemna lawa, unoszący się popiół, ogniste pterodaktyle.
   - **Cyber Horizon 2077** (2000m+): Neonowa siatka synthwave, świecące obeliski i futurystyczna atmosfera.

4. **Ewoluująca Proceduralna Muzyka & Dźwięk (Web Audio API)**:
   - Działa w 100% w przeglądarce bez zewnętrznych plików MP3.
   - **Dynamiczna Ewolucja Ścieżki Dźwiękowej**:
     - **Faza 1 (0 – 600m) - Spokojny Bieg (106–118 BPM)**: Relaksujący, klimatyczny synthwave, miękkie akordy, delikatny bas, subtelny shaker na offbeat.
     - **Faza 2 (600 – 1600m) - Synth Drive (124–138 BPM)**: Dynamiczny bas piłokształtny, rytmiczna stopa (kick), wyraziste hi-haty i arpeggia.
     - **Faza 3 (1600m+) - Cyber Overdrive (145–160+ BPM)**: Potężny, przesterowany reese bass, czterotaktowy ciężki beat (four-on-the-floor), ostry werbel, otwierające się filtry i szybkie motywy melodyczne techno/synthwave!
   - Wskaźnik tempa i fazy muzyki wyświetlany jest na bieżąco w HUD.

5. **Tablica Wyników i Porównywanie Osiągnięć (Ranking Społeczności)**:
   - Po każdym biegu (na ekranie Game Over) możesz wpisać swój pseudonim i zapisać wynik.
   - Globalna Tablica Wyników (Top 10 / 20) z medalami (🥇, 🥈, 🥉) pozwala porównać swój wynik z legendarnymi biegaczami.
   - Zakładka **Historia Biegów** przechowuje Twoje własne ostatnie osiągnięcia, dystanse i użyte skórki.
   - Podświetlenie Twoich wyników na turkusowo wraz z oznaczeniem `TY`.

---

## 🎮 Sterowanie

| Klawisz | Akcja |
|---|---|
| **A / D** lub **← / →** | Zmiana toru ruchu (Lewo / Środek / Prawo - zgodnie ze strzałkami) |
| **SPACJA / W / ↑** | Skok (oraz Podwójny Skok w powietrzu) |
| **SPACJA / ENTER** | Szybki wybór podświetlonego perka na ekranie Awansu Poziomu (Level Up) |
| **S / ↓** | Wślizg pod wysokimi pterodaktylami / Szybkie opadanie |
| **SHIFT / E** | Sprint (Dash) – niszczy przeszkody na drodze |
| **C** | Przełączanie kamery (Dynamiczna 3D / 2.5D Retro / FPV) |
| **ESC / P** | Pauza w grze |
| **1 / 2 / 3** | Szybki wybór 1., 2. lub 3. perka podczas ekranu Level Up |
| **Ekran dotykowy** | Przyciski dotykowe i gesty przeciągnięcia (Swipe) |

---

## 🚀 Jak uruchomić grę?

Możesz uruchomić grę na dwa sposoby:

### Sposób 1: Bezpośrednie otwarcie
Wystarczy dwukrotnie kliknąć plik `index.html` w przeglądarce (Chrome, Edge, Firefox, Brave, Safari).

### Sposób 2: Lokalny serwer WWW (Zalecany)
Uruchom skrypt `start.bat` lub w konsoli wpisz:
```bash
python -m http.server 8080
```
i otwórz w przeglądarce adres: `http://localhost:8080`.
