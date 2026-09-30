# PS3 Legacy Browser Bridge

Verzija **0.1.0** — nezavisni NTech Tools alat.

Ovaj alat pokreće mali HTTP server na računaru koji je na istoj privatnoj mreži kao PS3. PS3 pristupa računaru preko običnog lokalnog HTTP-a, dok računar prosleđuje zahteve ka `https://ps3tool.com` koristeći moderni TLS.

To je compatibility bridge — **nije offline flasher i nije kopija PS3Tool-a**.

## Pravni okvir projekta

- Repozitorijum ne sadrži PS3Tool App Core, patch payload, tekst sajta, logo niti druge njihove module.
- Internet na računaru mora da radi jer se PS3Tool sadržaj dobija direktno od originalnog servisa.
- PS3Tool zadržava svoja obaveštenja, zasluge i prava.
- Nisu uključeni Sony firmware, ključevi niti CFW PUP fajlovi.
- Projekat nije povezan sa PS3Tool timom ili kompanijom Sony.
- Potpune atribucije nalaze se u [NOTICE.md](NOTICE.md).

## Pokretanje

- macOS: dvoklik na `Start on macOS.command`.
- Windows: instaliraj Python 3 i pokreni `Start on Windows.bat`.
- Linux: pokreni `./start-on-linux.sh`.

Terminal će ispisati adresu sličnu ovoj:

```text
http://192.168.1.100:8080/flashtool/?legacy=1
```

Računar i PS3 moraju biti na istoj privatnoj mreži. Ostavi terminal otvoren. Na PS3 restartuj konzolu, nemoj uključivati HEN, očisti browser podatke i ručno unesi prikazanu `http://` adresu.

## Obavezna sigurnosna provera

Pisanje flash memorije može trajno brickovati konzolu. Nastavi samo ako originalni upstream alat jasno prikaže:

```text
CFW Capable: YES
```

Pre patchovanja napravi `dump.hex` na FAT32/MBR USB uređaju i proveri ga uključenim PyPS3Checker-om. Ne nastavljaj ako provera prijavi `DANGER` ili `WARNING`, osim ako je dokumentovani izuzetak pregledao iskusan serviser.

Nikada ne prekidaj napajanje, ne zatvaraj browser i ne prekidaj mrežu tokom pisanja flash memorije.

## Licenca

Alat je objavljen pod [GNU GPL verzijom 2](LICENSE). Uključeni PyPS3checker zadržava originalni copyright autora littlebalup i GPL v2 uslove.

Detaljnije uputstvo dostupno je u [README.md](README.md).
