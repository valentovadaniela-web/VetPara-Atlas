/******************************************************************************
 * VetPara Atlas
 * File: config.js
 ******************************************************************************/

class Config {

    constructor(data) {

        this.data = data;

    }

    get(path) {

        return path.split(".")

            .reduce((value, key) => value?.[key], this.data);

    }

}

export default Config;
