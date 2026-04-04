import api from '../api';

export const getProjectAnalytics = async (projectId) => {
  const { data } = await api.get(`/projects/${projectId}/analytics`);
  return data;
};
