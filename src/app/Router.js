/******************************************************************************
 * VetPara Atlas
 * Router
 *
 * PRIDANÉ (2026-09-26): zachovanie scroll pozície pri refreshi stránky
 * (F5 / Live Server auto-reload), aby sa pri kontrole zmien v kóde
 * neskákalo vždy na začiatok stránky.
 *
 * Princíp:
 *  - Scroll pozícia sa priebežne (throttled cez requestAnimationFrame)
 *    ukladá do sessionStorage, pod kľúčom viazaným na aktuálny hash
 *    (napr. "atlas-scroll:atlas/toxascaris_leonina_egg"). sessionStorage
 *    prežije F5, ale nie zatvorenie karty/reštart prehliadača — presne
 *    to, čo potrebujeme (dočasná pomôcka pri vývoji, nie trvalý stav).
 *  - Pri PRVOM volaní resolve() (t.j. reálny reload stránky, volaný zo
 *    start()) sa uložená pozícia OBNOVÍ.
 *  - Pri KAŽDOM ĎALŠOM volaní cez "hashchange" (t.j. používateľ/appka
 *    skutočne navigovali na inú stránku cez Router.navigate()) sa scroll
 *    naopak vynuluje na začiatok — to je bežné a očakávané správanie SPA
 *    (otvorenie iného parazita/inej stránky má začínať hore).
 *
 * POZNÁMKA (2026-09-26, história): v tejto session tu krátko existovala
 * aj funkcia repairTruncatedHash() — obranná záplata pre teóriu, že Live
 * Server pri reloade "odtŕha" ID parazita z hashu. Skutočná príčina
 * nahláseného javu bola napokon iná: AtlasPage.bindCards() (klik na kartu
 * v zozname) a tlačidlo "Späť na Atlas" volali preventDefault() a menili
 * pohľad len cez JS, BEZ toho, aby vôbec kedy nastavili
 * window.location.hash — takže žiadne skracovanie sa nedialo, hash tam
 * jednoducho nikdy nebol. Opravené priamo v AtlasPage.js (pridaný
 * history.pushState() pri oboch miestach), takže hash teraz vždy verne
 * odráža otvorený pohľad a táto záplata už nie je potrebná — odstránená,
 * aby nemýlila budúce session.
 ******************************************************************************/

class Router {

    constructor() {

        this.routes = new Map();

        // Handler priebežného ukladania scroll pozície pre AKTUÁLNY hash —
        // pri každom resolve() sa starý listener odpojí a nahradí novým
        // (viazaným na nový hash), aby sa neukladalo pod nesprávny kľúč.
        this.scrollHandler = null;
        this.scrollHandlerScheduled = false;

    }

    register(route, callback) {

        this.routes.set(route, callback);

    }

    
    navigate(route, param = null) {

        window.location.hash = param ? `${route}/${param}` : route;

    }

    start() {

        window.addEventListener("hashchange", () => {

            this.resolve({ isInitialLoad: false });

        });

        this.resolve({ isInitialLoad: true });

    }

    resolve({ isInitialLoad = false } = {}) {

        const hash =
          window.location.hash.replace("#", "") || "home";

        const [route, ...rest] = hash.split("/");
        const param = rest.length > 0 ? rest.join("/") : null;

        if (this.routes.has(route)) {

            this.routes.get(route)(param);

            if (isInitialLoad) {

                this.restoreScrollPosition(hash);

            } else {

                window.scrollTo(0, 0);

            }

            this.trackScrollPosition(hash);

            return;

        }

        console.warn(`Unknown route: ${route}`);

    }

    // ------------------------------------------------------------------
    // Zachovanie scroll pozície naprieč refreshom (viď POZNÁMKA hore)
    // ------------------------------------------------------------------

    getScrollStorageKey(hash) {

        return `atlas-scroll:${hash}`;

    }

    trackScrollPosition(hash) {

        // Odpojiť predchádzajúci listener (z predošlého hashu) — inak by
        // sa scroll ukladal pod kľúč starej stránky.
        if (this.scrollHandler) {

            window.removeEventListener("scroll", this.scrollHandler);

        }

        const storageKey = this.getScrollStorageKey(hash);

        this.scrollHandler = () => {

            // Throttling cez requestAnimationFrame — scroll event vie
            // vystreliť desiatky-krát za sekundu, takto sa sessionStorage
            // zapisuje najviac raz za snímku.
            if (this.scrollHandlerScheduled) {

                return;

            }

            this.scrollHandlerScheduled = true;

            requestAnimationFrame(() => {

                try {

                    sessionStorage.setItem(storageKey, String(window.scrollY));

                }

                catch (error) {

                    // sessionStorage môže zlyhať (napr. private mode) —
                    // scroll persistencia je len vývojárska pomôcka,
                    // appka má fungovať aj bez nej.

                }

                this.scrollHandlerScheduled = false;

            });

        };

        window.addEventListener("scroll", this.scrollHandler, { passive: true });

    }

    restoreScrollPosition(hash) {

        let saved;

        try {

            saved = sessionStorage.getItem(this.getScrollStorageKey(hash));

        }

        catch (error) {

            return;

        }

        if (saved === null) {

            return;

        }

        const scrollY = parseInt(saved, 10);

        if (Number.isNaN(scrollY)) {

            return;

        }

        // Dvojitý requestAnimationFrame — počká, kým prehliadač skutočne
        // vyrenderuje novo vložený obsah (innerHTML z route callbacku),
        // inak by scrollTo() bežal skôr, než má stránka svoju finálnu
        // výšku, a skok by nesadol presne.
        requestAnimationFrame(() => {

            requestAnimationFrame(() => {

                window.scrollTo(0, scrollY);

            });

        });

    }

}

export default new Router();
