/******************************************************************************
 * VetPara Atlas
 * Core application
 ******************************************************************************/

import AtlasPage from "../pages/AtlasPage.js";
import Router from "./Router.js";
import ApplicationState from "./ApplicationState.js";
import DatabaseService from "../services/DatabaseService.js";
import Repository from "../services/Repository.js";

const App = {

    async loadDatabase() {

        try {

            const database = await DatabaseService.loadDogDatabase();

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

    registerRoutes() {

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
                                    parazitológie určený pre laboratóriá,
                                    diagnostikov, univerzity a študentov.
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
                                Komplexná databáza diagnostických objektov.
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
                                Budúci inteligentný systém diferenciálnej
                                diagnostiky.
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

        Router.register("atlas", () => {

            const app = document.getElementById("app");

            // Databáza a Detail sú natvrdo vo svetlom režime (viď variables.css).
            document.body.classList.remove("dark-mode");

            app.innerHTML = AtlasPage.render();

            AtlasPage.init();

        });

        Router.register("gallery", () => {

            document.body.classList.remove("dark-mode");

            console.log("Gallery page");

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
