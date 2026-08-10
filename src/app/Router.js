/******************************************************************************
 * VetPara Atlas
 * Router
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

    }

    start() {

        window.addEventListener("hashchange", () => {

            this.resolve();

        });

        this.resolve();

    }

    resolve() {

        const route =
            window.location.hash.replace("#", "") || "home";

        if (this.routes.has(route)) {

            this.routes.get(route)();

            return;

        }

        console.warn(`Unknown route: ${route}`);

        this.navigate("home");

    }

}

export default new Router();