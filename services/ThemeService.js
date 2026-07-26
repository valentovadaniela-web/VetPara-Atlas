/******************************************************************************
 * VetPara Atlas
 * File: ThemeService.js
 ******************************************************************************/

const STORAGE_KEY = "vetpara-theme";

class ThemeService {

    constructor() {

        this.theme = localStorage.getItem(STORAGE_KEY) || "light";

    }

    apply() {

        document.documentElement.setAttribute(
            "data-theme",
            this.theme
        );

    }

    toggle() {

        this.theme = this.theme === "light"
            ? "dark"
            : "light";

        localStorage.setItem(
            STORAGE_KEY,
            this.theme
        );

        this.apply();

    }

}

export default new ThemeService();
