/******************************************************************************
 * VetPara Atlas
 * Core application
 ******************************************************************************/

import Router from "./Router.js";

const App = {

    async start() {

        console.info("================================");
        console.info(" VetPara Atlas");
        console.info(" Starting...");
        console.info("================================");

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