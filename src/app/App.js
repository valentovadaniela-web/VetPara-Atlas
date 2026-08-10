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

                <section class="hero">

                    <div class="container">

                        <div class="row align-items-center py-5">

                            <div class="col-lg-7">

                                <h1 class="display-4 fw-bold">
                                    VetPara Atlas
                                </h1>

                                <p class="lead">
                                    Moderný diagnostický atlas veterinárnej parazitológie.
                                </p>

                                <p>
                                    Projekt určený pre veterinárne laboratóriá,
                                    diagnostikov, univerzity a študentov.
                                </p>

                                <button
                                    type="button"
                                    class="btn btn-primary btn-lg"
                                    data-route="atlas"
                                >
                                    Otvoriť atlas
                                </button>

                            </div>

                            <div class="col-lg-5 text-center">

                                <img
                                    src="public/images/logo.svg"
                                    alt="VetPara Atlas"
                                    class="img-fluid"
                                    style="max-width:320px;"
                                >

                            </div>

                        </div>

                    </div>

                </section>

                <section>

                    <div class="container py-5">

                        <div class="row g-4">

                            <div class="col-md-4">

                                <button
                                    type="button"
                                    class="card h-100 shadow-sm text-start w-100 border-0"
                                    data-route="atlas"
                                >
                                    <div class="card-body">

                                        <h3>Databáza</h3>

                                        <p>
                                            Komplexná databáza diagnostických objektov.
                                        </p>

                                    </div>
                                </button>

                            </div>

                            <div class="col-md-4">

                                <button
                                    type="button"
                                    class="card h-100 shadow-sm text-start w-100 border-0"
                                    data-route="gallery"
                                >
                                    <div class="card-body">

                                        <h3>Galéria</h3>

                                        <p>
                                            Fotografie s odbornými metadátami.
                                        </p>

                                    </div>
                                </button>

                            </div>

                            <div class="col-md-4">

                                <button
                                    type="button"
                                    class="card h-100 shadow-sm text-start w-100 border-0"
                                    data-route="expert"
                                >
                                    <div class="card-body">

                                        <h3>Diagnostický expert</h3>

                                        <p>
                                            Budúci inteligentný systém diferenciálnej diagnostiky.
                                        </p>

                                    </div>
                                </button>

                            </div>

                        </div>

                    </div>

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