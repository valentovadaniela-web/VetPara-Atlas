/******************************************************************************
 * VetPara Atlas
 * File: DatabaseService.js
 ******************************************************************************/

class DatabaseService {

    constructor() {

        this.cache = new Map();

        this.currentDatabase = null;

        this.currentImages = null; // Pridané pre obrázky

    }

    async load(file) {

        if (this.cache.has(file)) {

            return this.cache.get(file);

        }

        // --- DYNAMICKÁ CESTA PRE GITHUB PAGES ---
        // Zistíme, či bežíme na GitHub Pages (detekcia podľa URL).
        const isGitHub = window.location.hostname.includes('github.io');
        
        // Ak sme na GitHube, cesta začína názvom repozitára.
        // Ak sme lokálne, cesta začína priamo /database/.
        const basePath = isGitHub ? '/VetPara-Atlas/database/' : '/database/';

        const response = await fetch(`${basePath}${file}`);
        // -------------------------------------------

        if (!response.ok) {

            throw new Error(`Cannot load database: ${file}`);

        }

        const json = await response.json();

        this.cache.set(file, json);

        return json;

    }

    // --- NAČÍTANIE DÁT ---
    async loadDatabase() {

    const database = await this.load("parasites.json");
    
    // --- NOVÉ: Načítanie images.json ---
    const images = await this.load("images.json");

    this.currentDatabase = database;
    this.currentImages = images; // Uloženie obrázkov

    return database;

    }

    // --- GET IMAGES ---
    getImages() {
    return this.currentImages || [];
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

        this.currentImages = null; // Pridané pre obrázky

    }

}

export default new DatabaseService();