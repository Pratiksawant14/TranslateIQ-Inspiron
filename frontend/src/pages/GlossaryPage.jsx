import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Upload,
  Trash2,
  BookOpen,
  AlertCircle,
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

const GlossaryPage = () => {
  const queryClient = useQueryClient();
  const csvInputRef = useRef(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ source_term: '', target_term: '', context_notes: '' });
  const [errors, setErrors] = useState({});

  // Fetch projects for project selector
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    onSuccess: (data) => {
      if (data?.length > 0 && !selectedProject) {
        setSelectedProject(data[0].id);
      }
    },
  });

  // Set first project on load
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-bold text-white">Glossary Manager</h1>
          <p className="text-slate-400 mt-1">Manage approved terminology per language pair</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => csvInputRef.current?.click()} disabled={!selectedProject}>
            <Upload className="w-4 h-4 mr-2" /> Import CSV
          </Button>
          <input ref={csvInputRef} type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          <Button variant="primary" onClick={() => setShowModal(true)} disabled={!selectedProject}>
            <Plus className="w-4 h-4 mr-2" /> Add Term
          </Button>
        </div>
      </div>

      {/* Project + Language selectors */}
      <Card className="px-6 py-4">
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
            className="w-48"
          />
          <Select
            label="Target Language"
            options={LANGUAGE_OPTIONS}
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="w-48"
          />
        </div>
      </Card>

      {/* No project selected */}
      {!selectedProject ? (
        <Card className="p-8 text-center">
          <p className="text-slate-400">Select a project to view its glossary.</p>
        </Card>
      ) : isLoading ? (
        <Card className="p-6">
          <div className="animate-pulse space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-800 rounded" />)}
          </div>
        </Card>
      ) : isError ? (
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Failed to load glossary</h3>
        </Card>
      ) : (!entries || entries.length === 0) ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-display font-semibold text-white mb-2">
            No terms yet for this language pair
          </h3>
          <p className="text-slate-400 mb-6">Add your first glossary term to enforce consistent translations.</p>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Term
          </Button>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1E3A5F]/30">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Source Term</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Term</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Context Notes</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Created</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3A5F]/20">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#1E3A5F]/10 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{entry.source_term}</td>
                    <td className="px-6 py-4 text-green-300 font-medium">{entry.target_term}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm max-w-xs truncate">
                      {entry.context_notes || <span className="italic text-slate-600">—</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{formatDate(entry.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => deleteMutation.mutate(entry.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded"
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
              <span className="text-slate-500">→</span>
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
              <label className="block text-sm font-medium text-slate-300">Context Notes</label>
              <textarea
                rows={2}
                placeholder="Optional notes about when to use this term"
                value={formData.context_notes}
                onChange={(e) => setFormData({ ...formData, context_notes: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#0A1628] border border-[#1E3A5F] text-white text-sm
                  placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-[#1E3A5F]/30">
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
