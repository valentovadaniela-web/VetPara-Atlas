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

    
    navigate(route, param = null) {

        window.location.hash = param ? `${route}/${param}` : route;

    }

    start() {

        window.addEventListener("hashchange", () => {

            this.resolve();

        });

        this.resolve();

    }

    resolve() {

        const hash =
          window.location.hash.replace("#", "") || "home";

        const [route, ...rest] = hash.split("/");
        const param = rest.length > 0 ? rest.join("/") : null;

        if (this.routes.has(route)) {

            this.routes.get(route)(param);

            return;

        }

        console.warn(`Unknown route: ${route}`);

    }

}

export default new Router();