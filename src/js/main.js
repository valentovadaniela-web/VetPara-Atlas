/******************************************************************************
 * VetPara Atlas
 * File: main.js
 * Entry point
 ******************************************************************************/

import App from "../app/App.js";

document.addEventListener("DOMContentLoaded", async () => {

    try {

        await App.start();

    }

    catch (error) {

        console.error("Application startup failed.", error);

    }

});