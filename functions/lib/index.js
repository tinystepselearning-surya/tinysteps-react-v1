"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onSessionCreate = exports.onAuthCreate = void 0;
// export { createAdmin } from "./createAdmin"; // Removed for security after initial admin creation
var onAuthCreate_1 = require("./onAuthCreate");
Object.defineProperty(exports, "onAuthCreate", { enumerable: true, get: function () { return onAuthCreate_1.onAuthCreate; } });
var onSessionCreate_1 = require("./onSessionCreate");
Object.defineProperty(exports, "onSessionCreate", { enumerable: true, get: function () { return onSessionCreate_1.onSessionCreate; } });
