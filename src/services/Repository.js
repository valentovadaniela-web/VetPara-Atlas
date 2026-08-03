/******************************************************************************
 * VetPara Atlas
 * File: Repository.js
 ******************************************************************************/

import DatabaseService from "./DatabaseService.js";

class Repository {

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