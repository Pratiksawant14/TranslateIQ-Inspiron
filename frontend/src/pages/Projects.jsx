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
  Layers,
  Globe,
  Sparkles,
  Search,
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
  { value: 'English', label: '🇺🇸 English' },
  { value: 'Spanish', label: '🇪🇸 Spanish' },
  { value: 'French', label: '🇫🇷 French' },
  { value: 'German', label: '🇩🇪 German' },
  { value: 'Japanese', label: '🇯🇵 Japanese' },
  { value: 'Portuguese', label: '🇵🇹 Portuguese' },
  { value: 'Italian', label: '🇮🇹 Italian' },
  { value: 'Arabic', label: '🇸🇦 Arabic' },
  { value: 'Chinese', label: '🇨🇳 Chinese' },
  { value: 'Hindi', label: '🇮🇳 Hindi' },
];

// Color accents per language
const LANG_COLORS = {
  English: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  Spanish: { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
  French: { bg: '#EDE9FE', text: '#7C3AED', border: '#DDD6FE' },
  German: { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
  Japanese: { bg: '#FCE7F3', text: '#DB2777', border: '#FBCFE8' },
  Portuguese: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  Italian: { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' },
  Arabic: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  Chinese: { bg: '#FEF2F2', text: '#E11D48', border: '#FECDD3' },
  Hindi: { bg: '#FFFBEB', text: '#CA8A04', border: '#FEF08A' },
};

const Projects = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', description: '', source_language: '', target_language: '' });
  const [errors, setErrors] = useState({});

  const { data: projects, isLoading, isError } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const filteredProjects = (projects || []).filter(
    (p) => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast('Project created successfully', 'success');
      setShowModal(false);
      setFormData({ name: '', description: '', source_language: '', target_language: '' });
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

  const getLangColor = (lang) => LANG_COLORS[lang] || LANG_COLORS.English;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Hero skeleton */}
        <div className="rounded-2xl p-10 animate-pulse" style={{ backgroundColor: 'var(--color-bg-elevated)' }}>
          <div className="h-8 rounded w-48 mb-3" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="h-4 rounded w-72" style={{ backgroundColor: 'var(--color-border-light)' }} />
        </div>
        <div className="grid grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-6 rounded w-3/4" style={{ backgroundColor: 'var(--color-border)' }} />
                <div className="h-4 rounded w-full" style={{ backgroundColor: 'var(--color-border-light)' }} />
                <div className="h-4 rounded w-2/3" style={{ backgroundColor: 'var(--color-border-light)' }} />
                <div className="h-10 rounded w-full mt-6" style={{ backgroundColor: 'var(--color-border)' }} />
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
        <div
          className="rounded-2xl p-10 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #2563EB 100%)' }}
        >
          <div className="relative z-10">
            <h1 className="font-display text-[32px] font-bold text-white">Projects</h1>
            <p className="text-indigo-200 mt-1">Manage your translation projects</p>
          </div>
        </div>
        <Card className="p-12 text-center">
          <AlertCircle className="w-14 h-14 mx-auto mb-4" style={{ color: 'var(--color-error)' }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Failed to load projects</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>Could not connect to the server. Please check if the backend is running.</p>
        </Card>
      </div>
    );
  }

  const isEmpty = !projects || projects.length === 0;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div
        className="rounded-2xl p-10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #6D28D9 40%, #2563EB 100%)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(25%, -35%)' }}
        />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(0, 50%)' }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)' }}
            >
              <FolderOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="font-display text-[32px] font-bold text-white leading-tight">Projects</h1>
              <p className="text-indigo-200 mt-1">Manage your translation projects</p>
            </div>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowModal(true)}
            className="!bg-white !text-indigo-600 hover:!bg-indigo-50 !text-base !px-6 !py-3"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </Button>
        </div>

        {/* Stats row */}
        <div className="relative z-10 flex items-center gap-6 mt-8">
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <Layers className="w-4 h-4 text-indigo-200" />
            <span className="text-white text-sm font-semibold">{projects?.length || 0} projects</span>
          </div>
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <Globe className="w-4 h-4 text-indigo-200" />
            <span className="text-white text-sm font-semibold">
              {[...new Set((projects || []).map(p => p.source_language))].length} languages
            </span>
          </div>
          <div className="flex-1" />
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-indigo-300" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-xl text-sm w-64 border-0 text-white placeholder:text-indigo-300"
              style={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Empty state */}
      {isEmpty ? (
        <Card className="p-20 flex flex-col items-center justify-center text-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', border: '1px solid #C7D2FE' }}
          >
            <FolderOpen className="w-10 h-10" style={{ color: '#4F46E5' }} />
          </div>
          <h3 className="text-2xl font-display font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
            No projects yet
          </h3>
          <p className="mb-8 max-w-md text-base" style={{ color: 'var(--color-text-secondary)' }}>
            Create your first project to get started with AI-powered translation.
          </p>
          <Button variant="primary" size="lg" onClick={() => setShowModal(true)} className="!text-base !px-8 !py-3">
            <Plus className="w-5 h-5 mr-2" />
            Create Project
          </Button>
        </Card>
      ) : (
        /* Project Grid — 2 columns, larger cards */
        <div className="grid grid-cols-2 gap-6">
          {filteredProjects.map((project) => {
            const langColor = getLangColor(project.source_language);
            return (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="group cursor-pointer rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.88)',
                  backdropFilter: 'blur(8px)',
                  borderColor: 'var(--color-border)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#818CF8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
              >
                {/* Colored accent bar at top */}
                <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${langColor.text}, ${langColor.border})` }} />

                <div className="p-7">
                  {/* Title row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                        style={{ backgroundColor: langColor.bg, border: `1px solid ${langColor.border}` }}
                      >
                        <FolderOpen className="w-5 h-5" style={{ color: langColor.text }} />
                      </div>
                      <div>
                        <h3
                          className="font-display font-bold text-lg leading-tight group-hover:text-indigo-600 transition-colors"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {project.name}
                        </h3>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-md inline-block mt-1"
                          style={{ backgroundColor: langColor.bg, color: langColor.text, border: `1px solid ${langColor.border}` }}
                        >
                          {project.source_language}
                        </span>
                      </div>
                    </div>
                    <ArrowRight
                      className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 mt-1"
                      style={{ color: '#6366F1' }}
                    />
                  </div>

                  {/* Description */}
                  <p
                    className="text-sm mb-6 min-h-[40px] line-clamp-2"
                    style={{ color: project.description ? 'var(--color-text-secondary)' : 'var(--color-text-muted)' }}
                  >
                    {project.description || 'No description provided'}
                  </p>

                  {/* Footer */}
                  <div
                    className="flex items-center justify-between pt-5"
                    style={{ borderTop: '1px solid var(--color-border-light)' }}
                  >
                    <div className="flex items-center gap-5">
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(project.created_at)}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        <FileText className="w-3.5 h-3.5" />
                        0 documents
                      </span>
                    </div>
                    <span
                      className="text-xs font-semibold group-hover:underline transition-all"
                      style={{ color: '#6366F1' }}
                    >
                      Open Project →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
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
              <label className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Description</label>
              <textarea
                rows={3}
                placeholder="Brief description of this project (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm resize-none
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>

            <Select
              label="Source Language"
              options={LANGUAGE_OPTIONS}
              value={formData.source_language}
              onChange={(e) => setFormData({ ...formData, source_language: e.target.value })}
              error={errors.source_language}
            />

            <Select
              label="Target Language"
              options={LANGUAGE_OPTIONS}
              value={formData.target_language}
              onChange={(e) => setFormData({ ...formData, target_language: e.target.value })}
              error={errors.target_language}
            />

            <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <Button variant="ghost" type="button" onClick={() => { setShowModal(false); setErrors({}); }}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Projects;
