import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  FolderOpen,
  ArrowRight,
  AlertCircle,
  Calendar,
  FileText,
} from 'lucide-react';
import { getProjects, createProject } from '../lib/api/projects';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { toast } from '../hooks/useToast';

const LANGUAGE_OPTIONS = [
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Hindi', label: 'Hindi' },
];

const Projects = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', source_language: '' });
  const [errors, setErrors] = useState({});

  const { data: projects, isLoading, isError } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast('Project created successfully', 'success');
      setShowModal(false);
      setFormData({ name: '', description: '', source_language: '' });
      setErrors({});
    },
    onError: () => {
      toast('Failed to create project', 'error');
    },
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Project name is required';
    if (!formData.source_language) newErrors.source_language = 'Source language is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    createMutation.mutate(formData);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-[28px] font-bold text-white">Projects</h1>
            <p className="text-slate-400 mt-1">Manage your translation projects</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-5 bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-slate-700 rounded w-16" />
                <div className="h-3 bg-slate-800 rounded w-full" />
                <div className="h-3 bg-slate-800 rounded w-2/3" />
                <div className="h-8 bg-slate-700 rounded w-28 mt-4" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-[28px] font-bold text-white">Projects</h1>
          <p className="text-slate-400 mt-1">Manage your translation projects</p>
        </div>
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Failed to load projects</h3>
          <p className="text-slate-400">Could not connect to the server. Please check if the backend is running.</p>
        </Card>
      </div>
    );
  }

  const isEmpty = !projects || projects.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-bold text-white">Projects</h1>
          <p className="text-slate-400 mt-1">Manage your translation projects</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Empty state */}
      {isEmpty ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-display font-semibold text-white mb-2">No projects yet</h3>
          <p className="text-slate-400 mb-6 max-w-md">
            Create your first project to get started with AI-powered translation.
          </p>
          <Button variant="primary" size="lg" onClick={() => setShowModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Create Project
          </Button>
        </Card>
      ) : (
        /* Project Grid */
        <div className="grid grid-cols-3 gap-5">
          {projects.map((project) => (
            <Card key={project.id} className="p-6 flex flex-col group" onClick={() => navigate(`/projects/${project.id}`)}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-display font-bold text-white text-lg leading-tight group-hover:text-blue-400 transition-colors">
                  {project.name}
                </h3>
                <Badge variant="fuzzy">{project.source_language}</Badge>
              </div>

              {project.description && (
                <p className="text-sm text-slate-400 mb-4 line-clamp-2 flex-1">
                  {project.description}
                </p>
              )}
              {!project.description && (
                <p className="text-sm text-slate-500 italic mb-4 flex-1">No description</p>
              )}

              <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 pt-3 border-t border-[#1E3A5F]/30">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(project.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  0 documents
                </span>
              </div>

              <Button variant="secondary" size="sm" className="w-full">
                Open Project <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <Modal title="Create New Project" onClose={() => { setShowModal(false); setErrors({}); }} size="md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Project Name"
              placeholder="e.g. Marketing Campaign Q4"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Description</label>
              <textarea
                rows={3}
                placeholder="Brief description of this project (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#0A1628] border border-[#1E3A5F] text-white text-sm placeholder:text-slate-500
                  focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-colors resize-none"
              />
            </div>

            <Select
              label="Source Language"
              options={LANGUAGE_OPTIONS}
              value={formData.source_language}
              onChange={(e) => setFormData({ ...formData, source_language: e.target.value })}
              error={errors.source_language}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-[#1E3A5F]/30">
              <Button variant="ghost" onClick={() => { setShowModal(false); setErrors({}); }}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={createMutation.isPending}>
                Create Project
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Projects;
