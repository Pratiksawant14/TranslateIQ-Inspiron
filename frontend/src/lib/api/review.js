import api from '../api';

export const getReviewSession = async (projectId, documentId) => {
  const { data } = await api.get(`/projects/${projectId}/documents/${documentId}/review`);
  return data;
};

export const acceptSegment = async (segmentId, targetLanguage) => {
  const { data } = await api.post(`/segments/${segmentId}/accept?target_language=${encodeURIComponent(targetLanguage)}`);
  return data;
};

export const editSegment = async (segmentId, newTranslation, targetLanguage) => {
  const { data } = await api.post(
    `/segments/${segmentId}/edit?target_language=${encodeURIComponent(targetLanguage)}`,
    { new_translation: newTranslation }
  );
  return data;
};

export const rejectSegment = async (segmentId) => {
  const { data } = await api.post(`/segments/${segmentId}/reject`);
  return data;
};

export const scoreDocument = async (projectId, documentId, targetLanguage) => {
  const { data } = await api.post(
    `/projects/${projectId}/documents/${documentId}/score?target_language=${encodeURIComponent(targetLanguage)}`
  );
  return data;
};

export const exportDocument = async (projectId, documentId) => {
  const response = await api.post(
    `/projects/${projectId}/documents/${documentId}/export`,
    {},
    { responseType: 'blob' }
  );
  return response;
};
export const approveAllSegments = async (projectId, documentId, targetLanguage) => {
  const { data } = await api.post(
    `/projects/${projectId}/documents/${documentId}/approve-all?target_language=${encodeURIComponent(targetLanguage)}`
  );
  return data;
};
