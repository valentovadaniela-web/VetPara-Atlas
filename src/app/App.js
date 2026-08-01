/******************************************************************************
 * VetPara Atlas
 * Core application
 ******************************************************************************/

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

        this.registerRoutes();

        Router.start();

        console.info("Application ready.");

    },

    registerRoutes() {

        Router.register("home", () => {

            console.log("Home page");

        });

        Router.register("atlas", () => {

            console.log("Atlas page");

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