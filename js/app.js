/******************************************************************************
 * VetPara Atlas
 * File: app.js
 * Version: 0.2.0
 ******************************************************************************/

const App = {

    config: null,

    async init() {

        console.info("====================================");
        console.info(" VetPara Atlas");
        console.info(" Initializing...");
        console.info("====================================");

        await this.loadConfiguration();

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

    printApplicationInfo() {

        if (!this.config) {

            console.warn("Configuration not loaded.");

            return;

        }

        console.table({

            Name: this.config.application.name,

            Version: this.config.application.version,

            Language: this.config.application.language,

            Status: this.config.application.status

        });

    }

};

document.addEventListener("DOMContentLoaded", () => {

    App.init();

});

export default App;
