/******************************************************************************
 * VetPara Atlas
 * File: DatabaseService.js
 ******************************************************************************/

class DatabaseService {

    constructor() {

    this.cache = new Map();

    this.currentDatabase = null;

}

    async load(file) {

        if (this.cache.has(file)) {

            return this.cache.get(file);

        }

        const response = await fetch(`database/${file}`);

        if (!response.ok) {

            throw new Error(`Cannot load database: ${file}`);

        }

        const json = await response.json();

        this.cache.set(file, json);

        return json;

    }
async loadDogDatabase() {

    const database = await this.load("dog.migrated.json");

    this.currentDatabase = database;

    return database;

}

isLoaded() {

    return this.currentDatabase != null;

}

getRecords() {

    if (!this.currentDatabase) {

        return [];

    }

    return this.currentDatabase;

}

getRecordById(id) {

    if (!this.currentDatabase) {

        return null;

    }

    return this.currentDatabase.find(item => item.id === id) ?? null;

}
    clearCache() {

    this.cache.clear();

    this.currentDatabase = null;

}

}

export default new DatabaseService();
