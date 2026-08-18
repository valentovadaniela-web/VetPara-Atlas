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

// OPRAVA (2026-08-18, deduplikácia databázy): loadDogDatabase() a
// loadAllHostDatabases() (14x fetch + merge) NAHRADENÉ jedným load() zo
// súboru "parasites.json" — ten teraz obsahuje všetky diagnostické objekty
// naprieč všetkými hostiteľmi (pozri AI_STATUS.md sekcia 0 a
// docs/2026-08-18_parasites-dedup-migration.md). Staré 14 *.migrated.json
// súborov ostávajú v database/ ako záložný zdroj pravdy, appka ich už ale
// nenačítava.
async loadDatabase() {

    const database = await this.load("parasites.json");

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
