# LAN File Transfer 0.0.1 — tutorijal

Ovaj tutorijal objašnjava kako da preneseš fajlove i cijele foldere između Windows, macOS i Linux računara na istoj lokalnoj mreži.

## 1. Odaberi prijemni računar

Prijemni računar je uređaj na kojem pokrećeš server. Svi uspješno preneseni fajlovi biće sačuvani u njegovom folderu `Received Files`.

Računar koji šalje ne mora imati instaliranu aplikaciju. Potreban mu je samo browser.

## 2. Instaliraj Node.js

Na prijemnom računaru mora biti instaliran Node.js 18 ili noviji.

Provjera verzije:

```bash
node --version
```

Ako Node.js nije instaliran, preuzmi aktuelnu LTS verziju sa [nodejs.org](https://nodejs.org/).

Windows desktop paket može sadržati `runtime/node.exe`; u tom slučaju posebna instalacija nije potrebna.

## 3. Pokreni server

### Windows

Dvaput klikni `Start on Windows.cmd`.

Ako Windows Firewall prikaže pitanje, dozvoli pristup samo za **Private networks**.

### macOS

Prvi put u Terminalu, unutar projektnog foldera, pokreni:

```bash
chmod +x "Start on macOS.command" "Stop on macOS.command"
```

Zatim pokreni:

```bash
./"Start on macOS.command"
```

Ako macOS blokira fajl, klikni ga uz `Control`, izaberi **Open** i potvrdi.

### Linux

Prvi put pokreni:

```bash
chmod +x start-on-linux.sh stop-on-linux.sh
```

Zatim:

```bash
./start-on-linux.sh
```

## 4. Otvori privatnu adresu

Serverski prozor prikazaće adresu sličnu ovoj:

```text
http://192.168.1.25:8765/a1b2c3d4e5f6/
```

Na računaru ili telefonu koji šalje podatke otvori tu adresu u Safariju, Chromeu, Edgeu ili Firefoxu.

Oba uređaja moraju biti na istoj Wi-Fi ili žičnoj mreži.

## 5. Pošalji fajlove ili foldere

Na web stranici možeš:

- izabrati jedan ili više fajlova;
- izabrati kompletan folder;
- prevući fajlove ili foldere na označeno područje.

Kod slanja foldera server automatski pravi isti folder i podfoldere unutar `Received Files`.

## 6. Provjeri rezultat

Za svaki fajl stranica prikazuje napredak. Uspješan prijenos završava porukom:

```text
Receiver confirmed
```

To znači da je prijemni računar potvrdio da je fajl sačuvan. Greška se prikazuje uz konkretan fajl.

Dodatna evidencija nalazi se u `transfer.log` na prijemnom računaru.

## 7. Više računara

Više uređaja može istovremeno slati podatke jednom pokrenutom serveru. Svaki uređaj otvara istu privatnu adresu.

Jedna otvorena stranica šalje na jedan prijemni računar. Verzija 0.0.1 ne šalje automatski isti fajl na više servera.

## 8. Zaustavi server

U serverskom terminalu pritisni `Ctrl+C` ili pokreni odgovarajuću Stop skriptu:

- Windows: `Stop on Windows.cmd`
- macOS: `Stop on macOS.command`
- Linux: `./stop-on-linux.sh`

## Rješavanje problema

### Stranica se ne otvara

- Provjeri da li je serverski prozor još otvoren.
- Provjeri da li su oba uređaja na istoj mreži.
- Ponovo prepiši cijelu adresu, uključujući nasumični završetak.
- Na Windowsu provjeri da je Firewall pristup dozvoljen za privatnu mrežu.
- Isključi VPN na oba uređaja tokom lokalnog prijenosa ako razdvaja mrežni saobraćaj.

### Node.js nije pronađen

Instaliraj Node.js 18 ili noviji, zatvori terminal i pokreni skriptu ponovo.

### Fajl već postoji

Server ga neće prepisati. Nova kopija dobija ime poput `fajl (1).pdf`.

### Veza je prekinuta

Nepotpuni `.part` fajl se uklanja. Ponovo pošalji taj fajl kada se veza stabilizuje.

## Sigurnosne preporuke

- Koristi aplikaciju samo na privatnoj i pouzdanoj mreži.
- Ne prosljeđuj privatnu adresu nepoznatim osobama.
- Zaustavi server kada završiš prijenos.
- Verzija 0.0.1 koristi lokalni HTTP bez enkripcije i nije namijenjena javnom internetu.
