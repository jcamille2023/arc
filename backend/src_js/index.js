"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.auth = void 0;
var app_1 = require("firebase-admin/app");
var auth_1 = require("firebase-admin/auth");
var database_1 = require("firebase-admin/database");
var socket_config_1 = require("./socket-config");
var app, db, auth;
function main() {
    app = (0, app_1.initializeApp)({
        credential: (0, app_1.applicationDefault)(),
        databaseURL: "https://arc-by-insight-default-rtdb.firebaseio.com/"
    });
    exports.auth = auth = (0, auth_1.getAuth)(app);
    exports.db = db = (0, database_1.getDatabase)(app);
    (0, socket_config_1.initServer)();
    return 0;
}
main();
