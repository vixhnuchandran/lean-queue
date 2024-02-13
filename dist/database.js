"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
    console.error("POSTGRES_URL is not defined in the environment variables.");
    process.exit(1);
}
const pool = new pg_1.Pool({
    connectionString,
    max: 10,
});
exports.pool = pool;
pool.on("connect", () => { });
pool.on("error", (err) => {
    console.error("Error connecting to the PostgreSQL database:", err.message);
});
