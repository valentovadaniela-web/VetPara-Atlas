/******************************************************************************
 * VetPara Atlas
 * Core application
 ******************************************************************************/

import AtlasPage from "../pages/AtlasPage.js";
import GalleryPage from "../pages/GalleryPage.js";
import Router from "./Router.js";
import ApplicationState from "./ApplicationState.js";
import DatabaseService from "../services/DatabaseService.js";
import Repository from "../services/Repository.js";

const App = {

    async loadDatabase() {

        try {

            const database = await DatabaseService.loadDatabase()

            ApplicationState.database = database;
            ApplicationState.ready = true;

            console.info(
                `Dog database loaded (${Repository.count()} records)`
            );

        }

        catch (error) {

            console.error(error);

        }

    },

    async start() {

        console.info("================================");
        console.info(" VetPara Atlas");
        console.info(" Starting...");
        console.info("================================");

        await this.loadDatabase();

        console.info(
            "Repository ready:",
            Repository.count(),
            "records"
        );

        this.registerRoutes();

        this.bindThemeToggle();
        this.bindNavToggle();
        Router.start();

        console.info("Application ready.");

    },

    bindThemeToggle() {

        const toggleButton = document.getElementById("theme-toggle");

        if (!toggleButton) {

            return;

        }

        toggleButton.addEventListener("click", () => {

            document.body.classList.toggle("dark-mode");

        });

    },

    bindNavToggle() {

    const toggleButton = document.getElementById("nav-toggle");
    const navLinks = document.getElementById("site-nav-links");

    if (!toggleButton || !navLinks) {

        return;

    }

    toggleButton.addEventListener("click", () => {

        const isOpen = navLinks.classList.toggle("is-open");

        toggleButton.setAttribute("aria-expanded", isOpen ? "true" : "false");

    });

    navLinks.querySelectorAll("a, button").forEach(el => {

        el.addEventListener("click", () => {

            navLinks.classList.remove("is-open");
            toggleButton.setAttribute("aria-expanded", "false");

        });

    });

},
    registerRoutes() {

        // Globálny helper volaný z GalleryPage.js (lightbox, tlačidlo
        // "Zobraziť v Atlase"). Presmeruje na Atlas s ID objektu v hashi;
        // Router.resolve() ho odovzdá route callbacku "atlas" nižšie.
        window.showAtlasDetail = (objectId) => {
            Router.navigate("atlas", objectId);
        };

        Router.register("home", () => {

            const app = document.getElementById("app");

            // Home je jediná stránka, ktorá smie byť v dark-mode
            // (viď variables.css: ".dark-mode #home-view" a
            // "#database-view, #detail-view" natvrdo blokujú dark-mode).
            document.body.classList.add("dark-mode");

            app.innerHTML = `

                <div id="home-view" class="view-page active-view">

                    <section class="hero-home">

                        <div class="hero-home-container">

                            <div class="hero-home-content">

                                <h1 class="hero-home-title">
                                    VetPara Atlas
                                </h1>

                                <p class="hero-home-subtitle">
                                    Moderný diagnostický atlas veterinárnej
                                    parazitológie určený pre laboratóriá a
                                    diagnostikov.
                                </p>

                                <button
                                    type="button"
                                    class="btn-open-atlas"
                                    data-route="atlas"
                                >
                                    Otvoriť atlas
                                </button>

                            </div>

                        </div>

                    </section>

                    <div class="home-cards-grid">

                        <button
                            type="button"
                            class="card home-card-button"
                            data-route="atlas"
                        >

                            <h3 class="home-card-title">Atlas</h3>

                            <p class="home-card-text">
                                Kompletná štruktúrovanádatabáza diagnostických objektov s možnosťou filtrovania.
                            </p>

                        </button>

                        <button
                            type="button"
                            class="card home-card-button"
                            data-route="gallery"
                        >

                            <h3 class="home-card-title">Galéria</h3>

                            <p class="home-card-text">
                                Fotografie s odbornými metadátami.
                            </p>

                        </button>

                        <button
                            type="button"
                            class="card home-card-button"
                            data-route="expert"
                        >

                            <h3 class="home-card-title">Diagnostický expert</h3>

                            <p class="home-card-text">
                                Budúci inteligentný systém pre rýchlu diferenciálnu diagnostiku.                              diagnostiky.
                            </p>

                        </button>

                    </div>

                </div>

            `;

            document
                .querySelectorAll("[data-route]")
                .forEach(button => {

                    button.addEventListener("click", () => {

                        Router.navigate(button.dataset.route);

                    });

                });

        });

        Router.register("atlas", (objectId) => {

            const app = document.getElementById("app");

            // Databáza a Detail sú natvrdo vo svetlom režime (viď variables.css).
            document.body.classList.remove("dark-mode");

            app.innerHTML = AtlasPage.render();

            AtlasPage.init();

            if (objectId) {
                AtlasPage.showDetail(objectId);
            }

        });

        Router.register("gallery", () => {

            document.body.classList.remove("dark-mode");

            const app = document.getElementById("app");
            app.innerHTML = GalleryPage.render();
            GalleryPage.init();

        });

        Router.register("expert", () => {

            document.body.classList.remove("dark-mode");

            console.log("Expert page");

        });

        Router.register("settings", () => {

            document.body.classList.remove("dark-mode");

            console.log("Settings page");

        });

    }

};

export default App;
