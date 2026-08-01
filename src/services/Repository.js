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

}

export default new Repository();