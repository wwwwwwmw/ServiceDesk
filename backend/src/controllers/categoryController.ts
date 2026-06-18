import { Request, Response } from 'express';
import { query } from '../config/db';

// Lấy danh sách tất cả các khu vực (Locations)
export const getLocations = async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT id, name FROM locations ORDER BY name ASC');
    return res.status(200).json(result.rows);
  } catch (error: any) {
    console.error('[GetLocations Controller Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách khu vực!' });
  }
};

// Lấy danh sách danh mục (Categories), có thể lọc theo type (request/incident)
export const getCategories = async (req: Request, res: Response) => {
  const { type } = req.query;
  try {
    let sql = 'SELECT id, name, type, template_json FROM categories';
    const params: any[] = [];

    if (type === 'request' || type === 'incident') {
      sql += ' WHERE type = $1';
      params.push(type);
    }
    sql += ' ORDER BY name ASC';

    const result = await query(sql, params);
    return res.status(200).json(result.rows);
  } catch (error: any) {
    console.error('[GetCategories Controller Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách danh mục!' });
  }
};

// Tạo danh mục mới (Chỉ dành cho Admin)
export const createCategory = async (req: Request, res: Response) => {
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
    
    const result = await query(
      `INSERT INTO categories (name, type, template_json) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, type, template_json`,
      [name, type, JSON.stringify(parsedTemplate)]
    );

    return res.status(201).json({
      message: 'Tạo danh mục thành công!',
      category: result.rows[0]
    });
  } catch (error: any) {
    console.error('[CreateCategory Controller Error]:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Danh mục này đã tồn tại trong nhóm này rồi!' });
    }
    return res.status(500).json({ error: 'Lỗi máy chủ khi tạo mới danh mục!' });
  }
};
