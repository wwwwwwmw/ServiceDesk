"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:5432/service_desk';
// Helper to get connection to postgres default database
function getPostgresDbUrl(url) {
    const parsed = new URL(url);
    parsed.pathname = '/postgres';
    return parsed.toString();
}
async function initDb() {
    console.log('Starting Database Initialization...');
    // 1. Create database service_desk if it doesn't exist
    const postgresUrl = getPostgresDbUrl(dbUrl);
    const adminClient = new pg_1.Client({ connectionString: postgresUrl });
    try {
        await adminClient.connect();
        const dbCheck = await adminClient.query("SELECT 1 FROM pg_database WHERE datname = 'service_desk'");
        if (dbCheck.rowCount === 0) {
            console.log('Database "service_desk" does not exist. Creating it...');
            // CREATE DATABASE cannot be executed inside a transaction block or function
            await adminClient.query('CREATE DATABASE service_desk');
            console.log('Database "service_desk" created successfully.');
        }
        else {
            console.log('Database "service_desk" already exists.');
        }
    }
    catch (err) {
        console.error('Error checking/creating database "service_desk":', err);
        process.exit(1);
    }
    finally {
        await adminClient.end();
    }
    // 2. Connect to service_desk database and execute schema + seed
    const targetClient = new pg_1.Client({ connectionString: dbUrl });
    try {
        await targetClient.connect();
        console.log('Connected to "service_desk" database.');
        // Read docs/db_init.md
        const docPath = path_1.default.join(__dirname, '../../docs/db_init.md');
        if (!fs_1.default.existsSync(docPath)) {
            throw new Error(`DB initialization markdown file not found at: ${docPath}`);
        }
        const docContent = fs_1.default.readFileSync(docPath, 'utf8');
        // Extract SQL blocks using Regex
        const sqlRegex = /```sql([\s\S]*?)```/g;
        let sqlScript = '';
        let match;
        while ((match = sqlRegex.exec(docContent)) !== null) {
            sqlScript += match[1] + '\n';
        }
        if (!sqlScript.trim()) {
            throw new Error('No SQL blocks found in db_init.md');
        }
        console.log('Executing DDL and DML SQL script...');
        await targetClient.query(sqlScript);
        console.log('Database schema and seed data loaded successfully!');
    }
    catch (err) {
        console.error('Error initializing schema/seed:', err);
        process.exit(1);
    }
    finally {
        await targetClient.end();
    }
    console.log('Database Initialization Finished!');
    process.exit(0);
}
initDb();
