"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./config/db");
async function check() {
    try {
        const result = await (0, db_1.query)("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
        console.log('Tables in database:', result.rows.map(r => r.tablename));
        if (result.rows.length > 0) {
            const usersCount = await (0, db_1.query)("SELECT COUNT(*) FROM users");
            console.log('Number of users:', usersCount.rows[0].count);
        }
    }
    catch (error) {
        console.error('Error connecting or querying database:', error);
    }
    finally {
        process.exit(0);
    }
}
check();
