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

        Router.start();

        console.info("Application ready.");

    },

    registerRoutes() {

        Router.register("home", () => {

            const app = document.getElementById("app");

            app.innerHTML = `

                <section class="home-page container py-5">

                    <h1 class="display-4 fw-bold">VetPara Atlas</h1>

                    <p class="lead">
                        Diagnostický atlas veterinárnej parazitológie.
                    </p>

                    <nav
                        class="main-navigation d-flex gap-2 flex-wrap"
                        aria-label="Hlavná navigácia"
                    >

                        <button
                            type="button"
                            class="btn btn-primary"
                            data-route="atlas"
                        >
                            Atlas
                        </button>

                        <button
                            type="button"
                            class="btn btn-outline-primary"
                            data-route="gallery"
                        >
                            Galéria
                        </button>

                        <button
                            type="button"
                            class="btn btn-outline-primary"
                            data-route="expert"
                        >
                            Expert
                        </button>

                        <button
                            type="button"
                            class="btn btn-outline-primary"
                            data-route="settings"
                        >
                            Nastavenia
                        </button>

                    </nav>

                </section>

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

            app.innerHTML = AtlasPage.render();

            AtlasPage.init();

        });

        Router.register("gallery", () => {

            console.log("Gallery page");

        });

        Router.register("expert", () => {

            console.log("Expert page");

        });

        Router.register("settings", () => {

            console.log("Settings page");

        });

    }

};

export default App;