import api from '../api';

export const getStyleProfiles = async (projectId) => {
  const { data } = await api.get(`/projects/${projectId}/style-profiles`);
  return data;
};

export const createStyleProfile = async (projectId, profileData) => {
  const { data } = await api.post(`/projects/${projectId}/style-profiles`, profileData);
  return data;
};

export const deleteStyleProfile = async (projectId, profileId) => {
  await api.delete(`/projects/${projectId}/style-profiles/${profileId}`);
};
