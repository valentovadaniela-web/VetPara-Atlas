/******************************************************************************
 * VetPara Atlas
 * File: router.js
 * Version: 0.2.0
 ******************************************************************************/

class Router {

    constructor() {

        this.routes = new Map();

    }

    register(route, callback) {

        this.routes.set(route, callback);

    }

    navigate(route) {

        if (!this.routes.has(route)) {

            console.warn(`Unknown route: ${route}`);

            return;

        }

        window.location.hash = route;

        this.routes.get(route)();

    }

    start() {

        window.addEventListener("hashchange", () => {

            const route = window.location.hash.substring(1) || "home";

            if (this.routes.has(route)) {

                this.routes.get(route)();

            }

        });

    }

}

export default Router;
