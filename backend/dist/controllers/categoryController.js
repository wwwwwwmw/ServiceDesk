"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategory = exports.getCategories = exports.getLocations = void 0;
const db_1 = require("../config/db");
// Lấy danh sách tất cả các khu vực (Locations)
const getLocations = async (req, res) => {
    try {
        const result = await (0, db_1.query)('SELECT id, name FROM locations ORDER BY name ASC');
        return res.status(200).json(result.rows);
    }
    catch (error) {
        console.error('[GetLocations Controller Error]:', error);
        return res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách khu vực!' });
    }
};
exports.getLocations = getLocations;
// Lấy danh sách danh mục (Categories), có thể lọc theo type (request/incident)
const getCategories = async (req, res) => {
    const { type } = req.query;
    try {
        let sql = 'SELECT id, name, type, template_json FROM categories';
        const params = [];
        if (type === 'request' || type === 'incident') {
            sql += ' WHERE type = $1';
            params.push(type);
        }
        sql += ' ORDER BY name ASC';
        const result = await (0, db_1.query)(sql, params);
        return res.status(200).json(result.rows);
    }
    catch (error) {
        console.error('[GetCategories Controller Error]:', error);
        return res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách danh mục!' });
    }
};
exports.getCategories = getCategories;
// Tạo danh mục mới (Chỉ dành cho Admin)
const createCategory = async (req, res) => {
    const { name, type, template_json } = req.body;
    if (!name || !type || !template_json) {
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ tên danh mục, loại (type) và cấu hình form (template_json)!' });
    }
    if (type !== 'request' && type !== 'incident') {
        return res.status(400).json({ error: 'Loại danh mục chỉ được phép là "request" hoặc "incident"!' });
    }
    try {
        // Lưu ý: template_json nhận vào mảng JSON
        const parsedTemplate = typeof template_json === 'string' ? JSON.parse(template_json) : template_json;
        const result = await (0, db_1.query)(`INSERT INTO categories (name, type, template_json) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, type, template_json`, [name, type, JSON.stringify(parsedTemplate)]);
        return res.status(201).json({
            message: 'Tạo danh mục thành công!',
            category: result.rows[0]
        });
    }
    catch (error) {
        console.error('[CreateCategory Controller Error]:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Danh mục này đã tồn tại trong nhóm này rồi!' });
        }
        return res.status(500).json({ error: 'Lỗi máy chủ khi tạo mới danh mục!' });
    }
};
exports.createCategory = createCategory;
