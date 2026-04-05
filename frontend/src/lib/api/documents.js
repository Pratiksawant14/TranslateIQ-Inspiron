import api from '../api';

export const uploadDocument = async (projectId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post(`/projects/${projectId}/documents/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getDocuments = async (projectId) => {
  const { data } = await api.get(`/projects/${projectId}/documents`);
  return data;
};

export const parseDocument = async (projectId, documentId) => {
  const { data } = await api.post(`/projects/${projectId}/documents/${documentId}/parse`);
  return data;
};

export const validateDocument = async (projectId, documentId) => {
  const { data } = await api.post(`/projects/${projectId}/documents/${documentId}/validate`);
  return data;
};

export const getValidationReport = async (projectId, documentId) => {
  const { data } = await api.get(`/projects/${projectId}/documents/${documentId}/validation-report`);
  return data;
};

export const classifyDocument = async (projectId, documentId, sourceLanguage, targetLanguage) => {
  const { data } = await api.post(`/projects/${projectId}/documents/${documentId}/classify`, {
    source_language: sourceLanguage,
    target_language: targetLanguage,
  });
  return data;
};

export const translateDocument = async (projectId, documentId, payload) => {
  const { data } = await api.post(`/projects/${projectId}/documents/${documentId}/translate`, payload);
  return data;
};

export const resolveIssue = async (projectId, documentId, issueId) => {
  const { data } = await api.post(`/projects/${projectId}/documents/${documentId}/issues/${issueId}/resolve`);
  return data;
};

export const deleteDocument = async (projectId, documentId) => {
  const { data } = await api.delete(`/projects/${projectId}/documents/${documentId}`);
  return data;
};
