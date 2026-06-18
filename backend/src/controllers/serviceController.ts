import { Request, Response } from 'express';
import { query } from '../config/db';

// 1. Lấy danh sách toàn bộ mẫu Yêu Cầu Dịch Vụ
export const getServiceTemplates = async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT st.id, st.title, st.description, st.category_id, cat.name as category_name, cat.type as category_type
       FROM service_templates st
       JOIN categories cat ON st.category_id = cat.id
       ORDER BY st.created_at ASC`
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('[GetServiceTemplates Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách mẫu dịch vụ!' });
  }
};

// 2. Lấy chi tiết một mẫu Yêu Cầu Dịch Vụ kèm biểu mẫu danh mục
export const getServiceTemplateById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT st.id, st.title, st.description, st.category_id, st.prefilled_data, 
              cat.name as category_name, cat.type as category_type, cat.template_json
       FROM service_templates st
       JOIN categories cat ON st.category_id = cat.id
       WHERE st.id = $1`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy mẫu dịch vụ yêu cầu!' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('[GetServiceTemplateById Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi lấy chi tiết mẫu dịch vụ!' });
  }
};

// 3. Lấy danh sách toàn bộ bài viết hướng dẫn xử lý sự cố (Incident guides)
export const getKnowledgeBaseArticles = async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT kb.id, kb.title, kb.category_id, kb.issue_description, kb.resolution_guide,
              cat.name as category_name, cat.type as category_type
       FROM knowledge_base kb
       JOIN categories cat ON kb.category_id = cat.id
       ORDER BY kb.created_at ASC`
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('[GetKnowledgeBaseArticles Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách hướng dẫn sự cố!' });
  }
};

// 4. Lấy chi tiết một bài viết hướng dẫn sự cố
export const getKnowledgeBaseArticleById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT kb.id, kb.title, kb.category_id, kb.issue_description, kb.resolution_guide,
              cat.name as category_name, cat.type as category_type, cat.template_json
       FROM knowledge_base kb
       JOIN categories cat ON kb.category_id = cat.id
       WHERE kb.id = $1`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết hướng dẫn sự cố!' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('[GetKnowledgeBaseArticleById Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi lấy chi tiết bài viết hướng dẫn!' });
  }
};
