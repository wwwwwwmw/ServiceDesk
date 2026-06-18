"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
// Helper function để truy vấn database nhanh chóng
const query = async (text, params) => {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // Log queries trong môi trường development nếu cần
    if (process.env.NODE_ENV !== 'production') {
        console.log('[Database SQL]:', { text, duration, rowsCount: res.rowCount });
    }
    return res;
};
exports.query = query;
exports.default = pool;
