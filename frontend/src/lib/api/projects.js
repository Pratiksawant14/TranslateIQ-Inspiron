import api from '../api';

export const getProjects = async () => {
  const { data } = await api.get('/projects');
  return data;
};

export const getProject = async (projectId) => {
  const { data } = await api.get(`/projects/${projectId}`);
  return data;
};

export const createProject = async (projectData) => {
  const { data } = await api.post('/projects', projectData);
  return data;
};

export const getDocuments = async (projectId) => {
  const { data } = await api.get(`/projects/${projectId}/documents`);
  return data;
};
