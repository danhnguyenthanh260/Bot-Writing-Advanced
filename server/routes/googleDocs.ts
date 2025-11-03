import { Router } from 'express';
import googleDocsService, { convertGoogleDocToWorkProfile } from '../../services/googleDocsService.ts';
import { workProfilesStore } from '../storage/workProfilesStore.ts';
import type { GoogleDocIngestPayload } from '../types.ts';

const router = Router();

router.post('/ingest', async (req, res) => {
  const payload = req.body as GoogleDocIngestPayload;
  const identifier = payload.url ?? payload.docId;

  if (!identifier) {
    return res.status(400).json({ error: 'Vui lòng gửi url hoặc docId của tài liệu.' });
  }

  try {
    const { doc } = await googleDocsService.getStructuredContent(identifier);
    const workProfile = convertGoogleDocToWorkProfile(
      doc,
      payload.url ?? `https://docs.google.com/document/d/${doc.docId}`
    );

    const nowIso = new Date().toISOString();
    workProfilesStore.upsert({
      ...workProfile,
      createdAt: nowIso,
      updatedAt: nowIso,
      document: doc,
    });

    return res.json({
      docId: doc.docId,
      document: doc,
      workProfile,
    });
  } catch (error: any) {
    console.error('Failed to ingest Google Doc:', error);
    const status = error?.code ?? error?.response?.status;
    if (status === 403 || status === 401) {
      return res.status(403).json({ error: 'Google Docs từ chối truy cập. Hãy kiểm tra quyền chia sẻ hoặc token OAuth.' });
    }
    if (status === 404) {
      return res.status(404).json({ error: 'Không tìm thấy tài liệu Google Docs. Hãy kiểm tra lại liên kết.' });
    }
    return res.status(500).json({ error: 'Lỗi không xác định khi kết nối với Google Docs.' });
  }
});

export default router;