"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncAllUserClaims = exports.adminSetUserClaims = exports.migrateParents = exports.adminDeleteUser = exports.adminCreateUser = exports.onSessionCreate = exports.onAuthCreate = void 0;
// export { createAdmin } from "./createAdmin"; // Removed for security after initial admin creation
var onAuthCreate_1 = require("./onAuthCreate");
Object.defineProperty(exports, "onAuthCreate", { enumerable: true, get: function () { return onAuthCreate_1.onAuthCreate; } });
var onSessionCreate_1 = require("./onSessionCreate");
Object.defineProperty(exports, "onSessionCreate", { enumerable: true, get: function () { return onSessionCreate_1.onSessionCreate; } });
var adminCreateUser_1 = require("./adminCreateUser");
Object.defineProperty(exports, "adminCreateUser", { enumerable: true, get: function () { return adminCreateUser_1.adminCreateUser; } });
var adminDeleteUser_1 = require("./adminDeleteUser");
Object.defineProperty(exports, "adminDeleteUser", { enumerable: true, get: function () { return adminDeleteUser_1.adminDeleteUser; } });
var migrateParents_1 = require("./migrateParents");
Object.defineProperty(exports, "migrateParents", { enumerable: true, get: function () { return migrateParents_1.migrateParents; } });
var adminSetUserClaims_1 = require("./adminSetUserClaims");
Object.defineProperty(exports, "adminSetUserClaims", { enumerable: true, get: function () { return adminSetUserClaims_1.adminSetUserClaims; } });
var syncAllUserClaims_1 = require("./syncAllUserClaims");
Object.defineProperty(exports, "syncAllUserClaims", { enumerable: true, get: function () { return syncAllUserClaims_1.syncAllUserClaims; } });
