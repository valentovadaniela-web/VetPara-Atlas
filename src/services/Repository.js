/******************************************************************************
 * VetPara Atlas
 * File: Repository.js
 ******************************************************************************/

import DatabaseService from "./DatabaseService.js";

// OPRAVA (2026-08-18, deduplikácia databázy): záznamy v parasites.json už
// nemajú ploché pole `host: [...]`, ale `hostGroups: [...]` (názvy skupín z
// dictionary/host_hierarchy.json, rozbaľované DYNAMICKY) + `hosts: [...]`
// (konkrétni hostitelia mimo skupinovej logiky). resolveHosts() nižšie
// zjednotí oboje do jedného poľa konkrétnych mien hostiteľov, aby filter
// v AtlasPage.js fungoval identicky ako predtým na `record.host`. Pozri
// AI_STATUS.md sekcia 0.3.
const HOST_HIERARCHY_FILE = "dictionary/host_hierarchy.json";

class Repository {

    constructor() {

        this.hostHierarchy = {};
        this.hostHierarchyLoaded = false;
        this.images = []; // Nové pole pre obrázky

    }

    // --- OBRÁZKY ---
    async loadImages() {

        try {

            this.images = await DatabaseService.load("images.json");

        }
        catch (error) {

            this.images = [];
            console.warn("VetPara Atlas: images.json sa nepodarilo načítať, obrázky sa nezobrazia.");

        }

    }

    getImagesForParasite(id) {

        return this.images.filter(img => img.parasiteId === id);

    }

    // --- HOST HIERARCHY ---
    async loadHostHierarchy() {

        try {

            this.hostHierarchy =
                await DatabaseService.load(HOST_HIERARCHY_FILE);

        }
        catch (error) {

            console.warn(
                "VetPara Atlas: host_hierarchy.json sa nepodarilo načítať, " +
                "hostGroups sa nebudú rozbaľovať na konkrétnych hostiteľov.",
                error
            );

            this.hostHierarchy = {};

        }

        this.hostHierarchyLoaded = true;

        return this.hostHierarchy;

    }

    // --- OSTATNÉ ---
    isHostInGroup(host, groupName) {

        let current = host;

        while (current) {

            if (current === groupName) {
                return true;
            }

            current = this.hostHierarchy[current];

        }

        return false;

    }

    resolveHosts(record) {

        const explicitHosts =
            Array.isArray(record?.hosts) ? record.hosts : [];

        const groups =
            Array.isArray(record?.hostGroups) ? record.hostGroups : [];

        if (groups.length === 0) {
            return [...new Set(explicitHosts)];
        }

        const groupMembers = Object.keys(this.hostHierarchy)
            .filter(host =>
                groups.some(group => this.isHostInGroup(host, group))
            );

        return [...new Set([...explicitHosts, ...groupMembers])];

    }

    getAll() {

        return DatabaseService.getRecords();

    }

    getById(id) {

        return DatabaseService.getRecordById(id);

    }

    count() {

        return this.getAll().length;

    }

    exists(id) {

        return this.getById(id) !== null;

    }

    getByField(field, value) {

        return this.getAll().filter(record => record[field] === value);

    }

    contains(field, value) {

        const search = String(value).toLowerCase();

        return this.getAll().filter(record => {

            const text = String(record[field] ?? "").toLowerCase();

            return text.includes(search);

        });

    }

    sortBy(field) {

        return [...this.getAll()].sort((a, b) => {

            const left = String(a[field] ?? "");

            const right = String(b[field] ?? "");

            return left.localeCompare(right);

        });

    }

    find(predicate) {

        return this.getAll().filter(predicate);

    }

    first() {

        return this.getAll()[0] ?? null;

    }

    last() {

        const records = this.getAll();

        return records[records.length - 1] ?? null;

    }

    filter(callback) {

        return this.getAll().filter(callback);

    }

    refresh() {

        return this.getAll();

    }

}

export default new Repository();