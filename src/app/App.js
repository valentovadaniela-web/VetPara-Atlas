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

            // Home je jediná stránka, ktorá smie byť v dark-mode
            // (viď variables.css: ".dark-mode #home-view" a
            // "#database-view, #detail-view" natvrdo blokujú dark-mode).
            document.body.classList.add("dark-mode");

            app.innerHTML = `
                <div id="home-view" class="view-page active-view">
                    <header class="site-header">
                        <a class="site-brand" href="#" data-route="home">VetPara Atlas</a>
                        <nav class="site-nav" aria-label="Hlavná navigácia">
                            <button type="button" class="site-nav-link is-active" data-route="home">Domov</button>
                            <button type="button" class="site-nav-link" data-route="atlas">Atlas</button>
                            <button type="button" class="site-nav-link" data-route="gallery">Galéria</button>
                            <button type="button" class="site-nav-link" data-route="expert">Diagnostický expert</button>
                        </nav>
                        <button class="mobile-menu-button" type="button" aria-label="Otvoriť menu">☰</button>
                    </header>
                    <main class="home-main">
                        <section class="hero-home">
                            <div class="hero-home-container"><div class="hero-home-content">
                                <h1 class="hero-home-title">VetPara Atlas</h1>
                                <p class="hero-home-subtitle">Moderný diagnostický atlas veterinárnej parazitológie.</p>
                                <p class="hero-home-lead">Projekt určený pre veterinárne laboratóriá, diagnostikov, univerzity a študentov.</p>
                                <form class="home-search" id="home-search-form">
                                    <span class="home-search-icon" aria-hidden="true">⌕</span>
                                    <input id="home-search-input" type="search" placeholder="Hľadať v atlase (napr. Toxocara canis, Babesia)">
                                    <button type="submit" aria-label="Vyhľadať">⌕</button>
                                </form>
                            </div></div>
                        </section>
                        <section class="home-cards-grid" aria-label="Funkcie atlasu">
                            <button type="button" class="card home-card-button" data-route="atlas"><span class="home-card-icon">▢</span><span><strong class="home-card-title">Databáza</strong><span class="home-card-text">Komplexná databáza diagnostických objektov.</span></span></button>
                            <button type="button" class="card home-card-button" data-route="gallery"><span class="home-card-icon">▧</span><span><strong class="home-card-title">Galéria</strong><span class="home-card-text">Fotografie s odbornými metadátami.</span></span></button>
                            <button type="button" class="card home-card-button" data-route="expert"><span class="home-card-icon">♙</span><span><strong class="home-card-title">Diagnostický expert</strong><span class="home-card-text">Budúci inteligentný systém diferenciálnej diagnostiky.</span></span></button>
                        </section>
                    </main>
                    <footer class="site-footer">VetPara Atlas © 2026</footer>
                </div>
            `;

            document.getElementById("home-search-form")?.addEventListener("submit", event => {
                event.preventDefault();
                AtlasPage.state.search = document.getElementById("home-search-input").value.trim();
                Router.navigate("atlas");
            });

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