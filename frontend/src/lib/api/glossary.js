import api from '../api';

export const getGlossaryEntries = async (projectId, sourceLang, targetLang) => {
  const params = {};
  if (sourceLang) params.source_language = sourceLang;
  if (targetLang) params.target_language = targetLang;
  const { data } = await api.get(`/projects/${projectId}/glossary`, { params });
  return data;
};

export const createGlossaryEntry = async (projectId, entryData) => {
  const { data } = await api.post(`/projects/${projectId}/glossary`, entryData);
  return data;
};

export const deleteGlossaryEntry = async (projectId, entryId) => {
  await api.delete(`/projects/${projectId}/glossary/${entryId}`);
};

export const importGlossaryCSV = async (projectId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post(`/projects/${projectId}/glossary/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};
