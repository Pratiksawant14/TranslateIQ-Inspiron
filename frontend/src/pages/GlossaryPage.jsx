import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Upload,
  Trash2,
  BookOpen,
  AlertCircle,
  Languages,
  ArrowRight,
  Search,
  Globe,
  Sparkles,
} from 'lucide-react';
import { getProjects } from '../lib/api/projects';
import {
  getGlossaryEntries,
  createGlossaryEntry,
  deleteGlossaryEntry,
  importGlossaryCSV,
} from '../lib/api/glossary';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
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

const GlossaryPage = () => {
  const queryClient = useQueryClient();
  const csvInputRef = useRef(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ source_term: '', target_term: '', context_notes: '' });
  const [errors, setErrors] = useState({});

  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    onSuccess: (data) => {
      if (data?.length > 0 && !selectedProject) {
        setSelectedProject(data[0].id);
      }
    },
  });

  React.useEffect(() => {
    if (projects?.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id);
    }
  }, [projects]);

  // Fetch glossary entries
  const { data: entries, isLoading, isError } = useQuery({
    queryKey: ['glossary', selectedProject, sourceLang, targetLang],
    queryFn: () => getGlossaryEntries(selectedProject, sourceLang, targetLang),
    enabled: !!selectedProject,
  });

  // Filter entries by search
  const filteredEntries = (entries || []).filter(
    (e) =>
      !searchTerm ||
      e.source_term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.target_term.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => createGlossaryEntry(selectedProject, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glossary'] });
      toast('Term added successfully', 'success');
      setShowModal(false);
      setFormData({ source_term: '', target_term: '', context_notes: '' });
      setErrors({});
    },
    onError: () => toast('Failed to add term', 'error'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (entryId) => deleteGlossaryEntry(selectedProject, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glossary'] });
      toast('Term deleted', 'success');
    },
    onError: () => toast('Failed to delete term', 'error'),
  });

  // Import CSV
  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const result = await importGlossaryCSV(selectedProject, file);
      queryClient.invalidateQueries({ queryKey: ['glossary'] });
      toast(`${result.imported_count} terms imported successfully`, 'success');
    } catch {
      toast('CSV import failed', 'error');
    }
    e.target.value = '';
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.source_term.trim()) newErrors.source_term = 'Source term is required';
    if (!formData.target_term.trim()) newErrors.target_term = 'Target term is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    createMutation.mutate({
      ...formData,
      source_language: sourceLang,
      target_language: targetLang,
    });
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const projectOptions = (projects || []).map((p) => ({ value: p.id, label: p.name }));

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div
        className="rounded-2xl p-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #2563EB 100%)',
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
        />
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(-20%, 40%)' }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)' }}
            >
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-display text-[28px] font-bold text-white">Glossary Manager</h1>
              <p className="text-indigo-200 mt-0.5 text-sm">Manage approved terminology per language pair</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => csvInputRef.current?.click()}
              disabled={!selectedProject}
              className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
            >
              <Upload className="w-4 h-4 mr-2" /> Import CSV
            </Button>
            <input ref={csvInputRef} type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
            <Button
              variant="primary"
              onClick={() => setShowModal(true)}
              disabled={!selectedProject}
              className="!bg-white !text-indigo-600 hover:!bg-indigo-50"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Term
            </Button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="relative z-10 flex items-center gap-6 mt-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <Globe className="w-4 h-4 text-indigo-200" />
            <span className="text-white text-sm font-medium">{entries?.length || 0} terms</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <Languages className="w-4 h-4 text-indigo-200" />
            <span className="text-white text-sm font-medium">{sourceLang}</span>
            <ArrowRight className="w-3 h-3 text-indigo-300" />
            <span className="text-white text-sm font-medium">{targetLang}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span className="text-white text-sm font-medium">{projects?.length || 0} projects</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <Card variant="elevated" className="px-6 py-5">
        <div className="flex items-end gap-4">
          <Select
            label="Project"
            options={projectOptions}
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-64"
          />
          <Select
            label="Source Language"
            options={LANGUAGE_OPTIONS}
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className="w-52"
          />
          <div className="flex items-center gap-2 pb-[9px]">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary-light)' }}
            >
              <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
            </div>
          </div>
          <Select
            label="Target Language"
            options={LANGUAGE_OPTIONS}
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="w-52"
          />
          <div className="flex-1" />
          {/* Search */}
          <div className="relative pb-[1px]">
            <Search className="w-4 h-4 absolute left-3 top-[11px]" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search terms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg text-sm border transition-colors w-56"
              style={{
                backgroundColor: 'var(--color-bg-base)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        </div>
      </Card>

      {/* Content */}
      {!selectedProject ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-primary-light)' }}
          >
            <BookOpen className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
          </div>
          <h3 className="text-xl font-display font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Select a project
          </h3>
          <p style={{ color: 'var(--color-text-muted)' }}>Choose a project to manage its glossary terms.</p>
        </Card>
      ) : isLoading ? (
        <Card className="p-6">
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-lg" style={{ backgroundColor: 'var(--color-bg-elevated)' }} />
            ))}
          </div>
        </Card>
      ) : isError ? (
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-error)' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Failed to load glossary</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>Please check if the backend is running.</p>
        </Card>
      ) : (!entries || entries.length === 0) ? (
        /* Beautiful Empty State */
        <Card className="p-16 flex flex-col items-center justify-center text-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
            style={{
              background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
              border: '1px solid #C7D2FE',
            }}
          >
            <BookOpen className="w-10 h-10" style={{ color: '#4F46E5' }} />
          </div>
          <h3
            className="text-2xl font-display font-bold mb-8"
            style={{ color: 'var(--color-text-primary)' }}
          >
            No terms yet for this language pair
          </h3>
          <div className="flex items-center gap-3">
            <Button variant="primary" size="lg" onClick={() => setShowModal(true)}>
              <Plus className="w-5 h-5 mr-2" /> Add Your First Term
            </Button>
            <Button variant="secondary" size="lg" onClick={() => csvInputRef.current?.click()}>
              <Upload className="w-5 h-5 mr-2" /> Import CSV
            </Button>
          </div>
        </Card>
      ) : (
        /* Glossary Table */
        <Card variant="elevated" className="p-0 overflow-hidden">
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center gap-3">
              <h2 className="font-semibold font-display" style={{ color: 'var(--color-text-primary)' }}>
                Terminology List
              </h2>
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                }}
              >
                {filteredEntries.length} {filteredEntries.length === 1 ? 'term' : 'terms'}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-base)' }}>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    Source Term ({sourceLang})
                  </th>
                  <th className="text-center px-3 py-3 w-10">
                    <ArrowRight className="w-4 h-4 mx-auto" style={{ color: 'var(--color-text-muted)' }} />
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    Target Term ({targetLang})
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Context Notes</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Created</th>
                  <th className="text-right px-6 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className="transition-colors duration-150 group"
                    style={{
                      borderBottom: idx < filteredEntries.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-base)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td className="px-6 py-4">
                      <span
                        className="font-medium text-sm px-2.5 py-1 rounded-md"
                        style={{
                          color: '#1E40AF',
                          backgroundColor: '#EFF6FF',
                        }}
                      >
                        {entry.source_term}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <ArrowRight className="w-3.5 h-3.5 mx-auto" style={{ color: 'var(--color-text-muted)' }} />
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="font-medium text-sm px-2.5 py-1 rounded-md"
                        style={{
                          color: '#065F46',
                          backgroundColor: '#ECFDF5',
                        }}
                      >
                        {entry.target_term}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm max-w-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                      {entry.context_notes || <span className="italic" style={{ color: 'var(--color-text-muted)' }}>—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {formatDate(entry.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => deleteMutation.mutate(entry.id)}
                        className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Term Modal */}
      {showModal && (
        <Modal title="Add Glossary Term" onClose={() => { setShowModal(false); setErrors({}); }} size="md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="fuzzy">{sourceLang}</Badge>
              <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              <Badge variant="exact">{targetLang}</Badge>
            </div>
            <Input
              label="Source Term"
              placeholder="e.g. machine learning"
              value={formData.source_term}
              onChange={(e) => setFormData({ ...formData, source_term: e.target.value })}
              error={errors.source_term}
            />
            <Input
              label="Target Term"
              placeholder="e.g. aprendizaje automático"
              value={formData.target_term}
              onChange={(e) => setFormData({ ...formData, target_term: e.target.value })}
              error={errors.target_term}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Context Notes</label>
              <textarea
                rows={2}
                placeholder="Optional notes about when to use this term"
                value={formData.context_notes}
                onChange={(e) => setFormData({ ...formData, context_notes: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm resize-none
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <Button variant="ghost" onClick={() => { setShowModal(false); setErrors({}); }}>Cancel</Button>
              <Button variant="primary" type="submit" loading={createMutation.isPending}>Add Term</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default GlossaryPage;
