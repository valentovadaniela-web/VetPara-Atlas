/******************************************************************************
 * VetPara Atlas
 * Global Application State
 ******************************************************************************/

const ApplicationState = {

    database: null,

    species: "dog",

    selectedRecord: null,

filters: {

    search: "",

    species: "dog",

    category: null,

    diagnosis: null,

    parasite: null

},

    ready: false,

    version: "0.1.0"

};

export default ApplicationState;