/******************************************************************************
 * VetPara Atlas
 * File: App.js
 * Version: 0.2.0
 ******************************************************************************/

import DatabaseService from "../services/DatabaseService.js";
import ApplicationState from "./ApplicationState.js";

const App = {

    config: null,

    async init() {

        console.info("====================================");
        console.info(" VetPara Atlas");
        console.info(" Initializing...");
        console.info("====================================");

        await this.loadConfiguration();

        await this.loadDatabase();

        this.printApplicationInfo();

        console.info("Application ready.");

    },

    async loadConfiguration() {

        try {

            const response = await fetch("../config/config.json");

            if (!response.ok) {

                throw new Error("Unable to load configuration.");

            }

            this.config = await response.json();

        }

        catch (error) {

            console.error(error);

        }

    },

    async loadDatabase() {

        try {

            const database = await DatabaseService.loadDogDatabase();

            ApplicationState.database = database;
            ApplicationState.ready = true;

            console.info(
                `Dog database loaded (${DatabaseService.getRecords().length} records).`
            );

        }

        catch (error) {

            console.error(error);

            alert("Dog database could not be loaded.");

        }

    },

    printApplicationInfo() {

        if (!this.config) {

            console.warn("Configuration not loaded.");

            return;

        }

        console.table({

            Name: this.config.application.name,
            Version: this.config.application.version,
            Language: this.config.application.language,
            Status: this.config.application.status,
            DatabaseLoaded: ApplicationState.ready,
            Records: DatabaseService.getRecords().length

        });

    }

};

document.addEventListener("DOMContentLoaded", () => {

    App.init();

});

export default App;