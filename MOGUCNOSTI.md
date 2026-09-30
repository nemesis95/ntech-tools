# LAN File Transfer — mogućnosti

LAN File Transfer služi za direktan prijenos fajlova i foldera između računara povezanih na istu lokalnu mrežu. Za prijenos nije potreban cloud servis niti korisnički nalog.

## Podržani sistemi

- **Windows** — pokretanje preko `Start on Windows.cmd`; potrebni Node.js runtime već je uključen.
- **macOS** — pokretanje preko `Start on macOS.command`; potreban je Node.js 18 ili noviji.
- **Linux** — pokretanje preko `start-on-linux.sh`; potreban je Node.js 18 ili noviji.
- Uređaj koji šalje fajlove koristi samo moderan web browser, kao što su Safari, Chrome, Edge ili Firefox.

## Slanje fajlova

- Slanje jednog ili više fajlova odjednom.
- Izbor čitavog foldera iz browsera.
- Prevlačenje fajlova i foldera na stranicu (*drag and drop*).
- Prijenos velikih fajlova bez njihovog učitavanja u memoriju odjednom.
- Prikaz napretka za svaki fajl posebno.
- Prikaz broja fajlova koji čekaju, uspješno završenih i neuspjelih fajlova.
- Prikaz ukupne količine prenesenih podataka.

## Folderi i organizacija

- Automatsko pravljenje potrebnih foldera na računaru koji prima podatke.
- Očuvanje originalne strukture foldera i podfoldera.
- Svi primljeni podaci čuvaju se u folderu `Received Files`.
- Postojeći fajl se nikada ne prepisuje: nova kopija dobija numerisano ime, na primjer `fotografija (1).jpg`.
- Neispravne i opasne putanje, uključujući pokušaje izlaska iz `Received Files` foldera, automatski se odbijaju.

## Komunikacija između računara

- Browser provjerava vezu sa računarom koji prima fajlove svake dvije sekunde.
- Status pokazuje da li je prijemni računar povezan ili nedostupan.
- Poslije svakog fajla prijemni računar šalje potvrdu da je fajl stvarno sačuvan.
- Ako dođe do problema, računar koji šalje dobija konkretnu poruku o grešci.
- Prekinuti ili nepotpuni prijenosi označavaju se kao neuspješni.
- Privremeni `.part` fajlovi brišu se nakon greške ili prekida veze.

## Više računara

- Jedan pokrenuti server može istovremeno primati fajlove sa više računara i drugih uređaja na istoj mreži.
- Windows, Mac i Linux računari mogu slati podatke istom prijemnom računaru.
- Telefoni i tableti takođe mogu slati fajlove ako njihov browser podržava izbor fajlova.
- Jedna otvorena stranica trenutno šalje podatke na jedan prijemni računar.
- Automatsko slanje istog fajla na više prijemnih računara istovremeno trenutno nije podržano.

## Evidencija i greške

- Uspješni prijenosi i greške prikazuju se uživo na web stranici.
- Prijemni računar vodi evidenciju u fajlu `transfer.log`.
- Evidencija sadrži vrijeme događaja, rezultat i putanju fajla.
- Crni serverski prozor takođe prikazuje aktivnost dok server radi.

## Sigurnost

- Pri svakom pokretanju generiše se nova nasumična privatna adresa.
- Osoba mora znati cijelu privatnu adresu da bi otvorila stranicu za slanje.
- Server radi samo dok je njegov proces pokrenut.
- Primljeni fajlovi ograničeni su na `Received Files` folder.
- Nazivi fajlova i foldera se provjeravaju i uklanjaju se nedozvoljeni znakovi.
- Aplikaciju treba koristiti samo na pouzdanoj privatnoj mreži, nikada na javnom Wi‑Fi-ju.
- Na Windowsu Firewall pristup treba dozvoliti samo za **Private networks**.

## Rad bez interneta

- Nakon što su potrebne komponente dostupne, prijenos radi bez interneta.
- Fajlovi putuju direktno kroz lokalnu mrežu i ne šalju se na cloud.
- Brzina prvenstveno zavisi od brzine lokalne Wi‑Fi ili žične mreže.

## Gdje se šta nalazi

- `Received Files/` — svi uspješno primljeni fajlovi i folderi.
- `transfer.log` — evidencija prijenosa i grešaka.
- `app/server.js` — serverska aplikacija i web interfejs.
- `runtime/node.exe` — ugrađeni Windows runtime.
- `README.txt` — upute za pokretanje na sva tri operativna sistema.
- `Start on Windows.cmd` / `Stop on Windows.cmd` — Windows kontrole.
- `Start on macOS.command` / `Stop on macOS.command` — macOS kontrole.
- `start-on-linux.sh` / `stop-on-linux.sh` — Linux kontrole.

## Trenutna ograničenja

- Računari moraju biti na istoj lokalnoj mreži.
- Nema automatskog otkrivanja drugih računara; privatna adresa se ručno otvara u browseru.
- Nema nastavka djelimično prenesenog fajla nakon prekida; fajl se šalje ponovo.
- Nema automatske sinhronizacije foldera niti brisanja fajlova na drugom računaru.
- Nema korisničkih naloga, trajnih lozinki ili pristupa preko interneta.
- macOS i Linux verzije zahtijevaju Node.js 18 ili noviji.

## Osnovni postupak

1. Poveži računare na istu pouzdanu mrežu.
2. Na računaru koji treba da primi podatke pokreni odgovarajuću Start skriptu.
3. Na računaru koji šalje otvori adresu prikazanu u serverskom prozoru.
4. Izaberi ili prevuci fajlove i foldere.
5. Sačekaj potvrdu `Receiver confirmed` za svaki fajl.
6. Provjeri primljene podatke u `Received Files` folderu.
7. Zaustavi server odgovarajućom Stop skriptom ili kombinacijom `Ctrl+C`.
