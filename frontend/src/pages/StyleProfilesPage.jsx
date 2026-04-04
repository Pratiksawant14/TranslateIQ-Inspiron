import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  Palette,
  AlertCircle,
} from 'lucide-react';
import { getProjects } from '../lib/api/projects';
import {
  getStyleProfiles,
  createStyleProfile,
  deleteStyleProfile,
} from '../lib/api/styleProfiles';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
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

const TONE_OPTIONS = [
  { value: 'formal', label: 'Formal', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { value: 'technical', label: 'Technical', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'conversational', label: 'Conversational', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'official', label: 'Official', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'social', label: 'Social', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
];

const getToneStyle = (tone) => {
  const found = TONE_OPTIONS.find((t) => t.value === tone);
  return found ? found.color : 'bg-slate-800 text-slate-300';
};

const StyleProfilesPage = () => {
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', tone: 'formal', target_language: '', custom_rules: '',
  });
  const [errors, setErrors] = useState({});

  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  React.useEffect(() => {
    if (projects?.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id);
    }
  }, [projects]);

  // Fetch profiles
  const { data: profiles, isLoading, isError } = useQuery({
    queryKey: ['style-profiles', selectedProject],
    queryFn: () => getStyleProfiles(selectedProject),
    enabled: !!selectedProject,
  });

  // Create
  const createMutation = useMutation({
    mutationFn: (data) => createStyleProfile(selectedProject, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-profiles'] });
      toast('Style profile created', 'success');
      setShowModal(false);
      setFormData({ name: '', tone: 'formal', target_language: '', custom_rules: '' });
      setErrors({});
    },
    onError: () => toast('Failed to create profile', 'error'),
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: (profileId) => deleteStyleProfile(selectedProject, profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-profiles'] });
      toast('Profile deleted', 'success');
    },
    onError: () => toast('Failed to delete profile', 'error'),
  });

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Profile name is required';
    if (!formData.target_language) newErrors.target_language = 'Target language is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    createMutation.mutate(formData);
  };

  const projectOptions = (projects || []).map((p) => ({ value: p.id, label: p.name }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-bold text-white">Style Profiles</h1>
          <p className="text-slate-400 mt-1">Configure tone and style rules for each project</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} disabled={!selectedProject}>
          <Plus className="w-4 h-4 mr-2" /> New Profile
        </Button>
      </div>

      {/* Project selector */}
      <Card className="px-6 py-4">
        <Select
          label="Project"
          options={projectOptions}
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-64"
        />
      </Card>

      {!selectedProject ? (
        <Card className="p-8 text-center">
          <p className="text-slate-400">Select a project to manage its style profiles.</p>
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-5">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-5 bg-slate-700 rounded w-3/4" />
                <div className="h-8 bg-slate-700 rounded w-24" />
                <div className="h-3 bg-slate-800 rounded w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Failed to load profiles</h3>
        </Card>
      ) : (!profiles || profiles.length === 0) ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <Palette className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-display font-semibold text-white mb-2">No style profiles yet</h3>
          <p className="text-slate-400 mb-6">Create a profile to enforce consistent tone in translations.</p>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Profile
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {profiles.map((profile) => (
            <Card key={profile.id} className="p-6 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-display font-bold text-white text-lg">{profile.name}</h3>
                <Badge variant="fuzzy">{profile.target_language}</Badge>
              </div>

              {/* Tone pill */}
              <div className="mb-4">
                <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium border capitalize ${getToneStyle(profile.tone)}`}>
                  {profile.tone}
                </span>
              </div>

              {/* Custom rules */}
              <div className="flex-1 mb-4">
                {profile.custom_rules ? (
                  <p className="text-xs font-mono text-slate-400 bg-[#0A1628] rounded-lg p-3 line-clamp-3">
                    {profile.custom_rules.substring(0, 100)}
                    {profile.custom_rules.length > 100 ? '...' : ''}
                  </p>
                ) : (
                  <p className="text-sm italic text-slate-600">No custom rules</p>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-[#1E3A5F]/30">
                <button
                  onClick={() => deleteMutation.mutate(profile.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors p-1.5 rounded flex items-center gap-1 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Profile Modal */}
      {showModal && (
        <Modal title="Create Style Profile" onClose={() => { setShowModal(false); setErrors({}); }} size="md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Profile Name"
              placeholder="e.g. Marketing Formal"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
            />

            <Select
              label="Target Language"
              options={LANGUAGE_OPTIONS}
              value={formData.target_language}
              onChange={(e) => setFormData({ ...formData, target_language: e.target.value })}
              error={errors.target_language}
            />

            {/* Tone pill selector */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Tone</label>
              <div className="flex flex-wrap gap-2">
                {TONE_OPTIONS.map((opt) => {
                  const isSelected = formData.tone === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, tone: opt.value })}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all capitalize
                        ${isSelected ? opt.color : 'bg-transparent border-[#1E3A5F] text-slate-500 hover:text-slate-300'}
                      `}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Custom Rules</label>
              <textarea
                rows={3}
                placeholder="e.g. Always use active voice. Avoid passive constructions. Use Oxford comma."
                value={formData.custom_rules}
                onChange={(e) => setFormData({ ...formData, custom_rules: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#0A1628] border border-[#1E3A5F] text-white text-sm
                  placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#1E3A5F]/30">
              <Button variant="ghost" onClick={() => { setShowModal(false); setErrors({}); }}>Cancel</Button>
              <Button variant="primary" type="submit" loading={createMutation.isPending}>Create Profile</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default StyleProfilesPage;
