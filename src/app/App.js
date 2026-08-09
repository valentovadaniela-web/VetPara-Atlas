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
    <h2>VetPara Atlas</h2>
    <p>Diagnostický atlas veterinárnej parazitológie.</p>
`;

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