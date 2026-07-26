/******************************************************************************
 * VetPara Atlas
 * File: DatabaseService.js
 ******************************************************************************/

class DatabaseService {

    constructor() {

        this.cache = new Map();

    }

    async load(file) {

        if (this.cache.has(file)) {

            return this.cache.get(file);

        }

        const response = await fetch(`../database/${file}`);

        if (!response.ok) {

            throw new Error(`Cannot load database: ${file}`);

        }

        const json = await response.json();

        this.cache.set(file, json);

        return json;

    }

    clearCache() {

        this.cache.clear();

    }

}

export default new DatabaseService();
