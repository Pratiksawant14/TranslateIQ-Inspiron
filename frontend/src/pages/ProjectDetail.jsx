import React, { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Upload,
  FileText,
  File,
  CloudUpload,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  PenLine,
  Download,
  ArrowRight,
  CheckSquare,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { getProject } from '../lib/api/projects';
import {
  getDocuments,
  uploadDocument,
  parseDocument,
  validateDocument,
  classifyDocument,
  translateDocument,
  deleteDocument,
} from '../lib/api/documents';
import { scoreDocument } from '../lib/api/review';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import StatusBadge from '../components/ui/StatusBadge';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { toast } from '../hooks/useToast';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'it', label: 'Italian' },
  { value: 'ar', label: 'Arabic' },
  { value: 'zh', label: 'Chinese' },
  { value: 'hi', label: 'Hindi' },
];

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetLanguage, setTargetLanguage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStep, setUploadStep] = useState(null); // null | 'uploading' | 'parsing' | 'done'

  // Pipeline action state
  const [actionLoading, setActionLoading] = useState({}); // { [docId]: 'action_name' }

  // Queries
  const { data: project, isLoading: projectLoading, isError: projectError } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
  });

  const { data: documents, isLoading: docsLoading, isError: docsError } = useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => getDocuments(projectId),
    refetchInterval: (query) => {
      // Poll every 3s if any document is in a transitional status
      const docs = query.state.data;
      if (!docs) return false;
      const transitional = docs.some((d) =>
        ['parsing', 'validating', 'classifying', 'translating'].includes(d.status)
      );
      return transitional ? 3000 : false;
    },
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // Drag and drop handlers
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.pdf') || file.name.endsWith('.docx'))) {
      setSelectedFile(file);
    } else {
      toast('Only PDF and DOCX files are accepted', 'error');
    }
  };
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  // Upload + Parse flow
  const handleUploadAndProcess = async () => {
    if (!selectedFile) return toast('Please select a file', 'error');
    if (!targetLanguage) return toast('Please select a target language', 'error');

    try {
      setUploadStep('uploading');
      const doc = await uploadDocument(projectId, selectedFile);
      toast('File uploaded successfully', 'success');

      setUploadStep('parsing');
      await parseDocument(projectId, doc.id);
      toast('Document parsed — ready for validation', 'success');

      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      setShowUploadModal(false);
      resetUploadForm();
    } catch (err) {
      toast(err.response?.data?.detail || 'Upload failed', 'error');
    } finally {
      setUploadStep(null);
    }
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setTargetLanguage('');
    setUploadStep(null);
  };

  // Pipeline action: Validate
  const handleValidate = async (doc) => {
    setActionLoading((p) => ({ ...p, [doc.id]: 'validating' }));
    try {
      await validateDocument(projectId, doc.id);
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      toast('Validation complete', 'success');
      navigate(`/projects/${projectId}/documents/${doc.id}/validate`);
    } catch (err) {
      toast(err.response?.data?.detail || 'Validation failed', 'error');
    } finally {
      setActionLoading((p) => { const n = { ...p }; delete n[doc.id]; return n; });
    }
  };

  // Pipeline action: Classify + Translate
  const handleTranslate = async (doc) => {
    if (!project) return;
    setActionLoading((p) => ({ ...p, [doc.id]: 'classifying' }));
    try {
      // Classify first
      await classifyDocument(projectId, doc.id, project.source_language, targetLanguage || 'es');

      setActionLoading((p) => ({ ...p, [doc.id]: 'translating' }));
      // Translate
      const result = await translateDocument(projectId, doc.id, {
        source_language: project.source_language,
        target_language: targetLanguage || 'es',
      });

      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      toast(`Translation complete — ${result.translated_count} segments translated`, 'success');
    } catch (err) {
      toast(err.response?.data?.detail || 'Translation pipeline failed', 'error');
    } finally {
      setActionLoading((p) => { const n = { ...p }; delete n[doc.id]; return n; });
    }
  };

  // Pipeline action: Score
  const handleScore = async (doc) => {
    if (!project) return;
    setActionLoading((p) => ({ ...p, [doc.id]: 'scoring' }));
    try {
      await scoreDocument(projectId, doc.id, project.target_language || 'es');
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      toast('Quality scoring complete', 'success');
      navigate(`/projects/${projectId}/documents/${doc.id}/review`);
    } catch (err) {
      toast(err.response?.data?.detail || 'Scoring failed', 'error');
    } finally {
      setActionLoading((p) => { const n = { ...p }; delete n[doc.id]; return n; });
    }
  };

  // Loading
  if (projectLoading || docsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 bg-slate-700 rounded animate-pulse" />
          <div className="h-7 bg-slate-700 rounded w-48 animate-pulse" />
        </div>
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-800 rounded-lg" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // Error
  if (projectError || docsError) {
    return (
      <div className="space-y-6">
        <Link to="/projects" className="inline-flex items-center text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
        </Link>
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Failed to load project</h3>
          <p className="text-slate-400">Could not connect to the server.</p>
        </Card>
      </div>
    );
  }

  const handleDelete = async (doc) => {
    if (!window.confirm(`Are you sure you want to delete ${doc.filename}? This will delete all its segments.`)) return;
    try {
      setActionLoading((p) => ({ ...p, [doc.id]: 'deleting' }));
      await deleteDocument(projectId, doc.id);
      toast('Document deleted', 'success');
      queryClient.invalidateQueries(['documents', projectId]);
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to delete', 'error');
    } finally {
      setActionLoading((p) => { const n = { ...p }; delete n[doc.id]; return n; });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/projects" className="inline-flex items-center text-slate-400 hover:text-white transition-colors text-sm mb-3">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Projects
          </Link>
          <h1 className="font-display text-[28px] font-bold text-white">{project.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="fuzzy">{project.source_language}</Badge>
            {project.description && (
              <span className="text-slate-400 text-sm">{project.description}</span>
            )}
          </div>
        </div>
        <Button variant="primary" onClick={() => setShowUploadModal(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Documents Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-display font-semibold text-white text-lg">Documents</h2>
          <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
            {documents?.length || 0}
          </span>
        </div>

        {(!documents || documents.length === 0) ? (
          <Card className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-display font-semibold text-white mb-2">No documents yet</h3>
            <p className="text-slate-400 mb-6">Upload a PDF or DOCX to begin the translation pipeline.</p>
            <Button variant="primary" onClick={() => setShowUploadModal(true)}>
              <Upload className="w-4 h-4 mr-2" /> Upload Document
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                projectId={projectId}
                actionLoading={actionLoading[doc.id]}
                onValidate={() => handleValidate(doc)}
                onTranslate={() => handleTranslate(doc)}
                onScore={() => handleScore(doc)}
                onNavigateReview={() => navigate(`/projects/${projectId}/documents/${doc.id}/review`)}
                onDelete={() => handleDelete(doc)}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <Modal title="Upload Document" onClose={() => { setShowUploadModal(false); resetUploadForm(); }} size="md">
          <div className="space-y-5">
            {/* Drop Zone */}
            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
                  ${isDragging
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-[#1E3A5F] hover:border-[#2D4A77] hover:bg-[#0A1628]/50'
                  }
                `}
              >
                <CloudUpload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-blue-400' : 'text-slate-400'}`} />
                <p className="text-sm font-medium text-white">Drop PDF or DOCX here</p>
                <p className="text-xs text-slate-500 mt-1">or click to browse</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between bg-[#0A1628] border border-[#1E3A5F] rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <File className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <Select
              label="Target Language"
              options={LANGUAGE_OPTIONS}
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
            />

            {/* Upload step indicator */}
            {uploadStep && (
              <div className="flex items-center gap-2 text-sm text-blue-400 bg-blue-500/5 border border-blue-500/20 rounded-lg px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                {uploadStep === 'uploading' && 'Uploading document...'}
                {uploadStep === 'parsing' && 'Parsing document structure...'}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-[#1E3A5F]/30">
              <Button variant="ghost" onClick={() => { setShowUploadModal(false); resetUploadForm(); }} disabled={!!uploadStep}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUploadAndProcess}
                loading={!!uploadStep}
                disabled={!selectedFile || !targetLanguage}
              >
                Upload & Process
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Document Card sub-component
const DocumentCard = ({ doc, projectId, actionLoading, onValidate, onTranslate, onScore, onNavigateReview, onDelete, formatDate }) => {
  const navigate = useNavigate();

  const getFileIcon = () => {
    return doc.file_type === 'pdf'
      ? <FileText className="w-5 h-5 text-red-400" />
      : <File className="w-5 h-5 text-blue-400" />;
  };

  const getActionLabel = () => {
    if (actionLoading === 'deleting') return 'Deleting...';
    if (actionLoading === 'validating') return 'Validating...';
    if (actionLoading === 'classifying') return 'Classifying segments...';
    if (actionLoading === 'translating') return 'Translating new segments...';
    if (actionLoading === 'scoring') return 'Scoring quality...';
    return null;
  };

  const renderActions = () => {
    const loadingLabel = getActionLabel();
    if (loadingLabel) {
      return (
        <div className="flex items-center gap-2 text-sm text-blue-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingLabel}
        </div>
      );
    }

    const currentStatus = doc.status.toLowerCase();
    
    switch (currentStatus) {
      case 'uploaded':
        return (
          <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); /* parse is auto but safe to keep button */ }}>
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Parse Document
          </Button>
        );
      case 'parsing':
      case 'parsed':
        return (
          <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); onValidate(); }}>
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Validate
          </Button>
        );
      case 'validating':
      case 'validated':
        return (
          <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); onTranslate(); }}>
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Translate
          </Button>
        );
      case 'translating':
      case 'translated':
      case 'reviewing':
        return (
          <div className="flex items-center gap-2">
            {(currentStatus === 'translated' || currentStatus === 'reviewing') && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-400 hover:text-white"
                onClick={(e) => { e.stopPropagation(); onTranslate(); }}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Redo
              </Button>
            )}
            
            {currentStatus === 'reviewing' ? (
              <Button 
                variant="primary" 
                size="sm" 
                onClick={(e) => { e.stopPropagation(); onNavigateReview(); }}
              >
                <PenLine className="w-3.5 h-3.5 mr-1.5" /> Open Review Editor
              </Button>
            ) : (
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-purple-600 hover:bg-purple-700 border-purple-500"
                onClick={(e) => { 
                    e.stopPropagation(); 
                    onScore(); 
                }}
              >
                <CheckSquare className="w-3.5 h-3.5 mr-1.5" /> Score MT Quality
              </Button>
            )}
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-2">
            <Button variant="success" size="sm" onClick={(e) => { e.stopPropagation(); }}>
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export
            </Button>
            <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); onNavigateReview(); }}>
              <PenLine className="w-3.5 h-3.5 mr-1.5" /> Open Editor
            </Button>
          </div>
        );
      default:
        // Default to a debug primary button if status is unknown but we have a doc
        return (
          <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); onNavigateReview(); }}>
            <ArrowRight className="w-3.5 h-3.5 mr-1.5" /> View Project
          </Button>
        );
    }
  };

  const handleCardClick = () => {
    // Determine where to go based on status
    if (['uploaded', 'parsing', 'parsed', 'validating'].includes(doc.status)) {
      onValidate();
    } else if (['validated', 'classifying', 'translating'].includes(doc.status)) {
      onTranslate();
    } else if (['translated'].includes(doc.status)) {
      // Don't navigate to review yet, need scoring
      onScore();
    } else if (['reviewing', 'completed'].includes(doc.status)) {
      onNavigateReview();
    }
  };

  return (
    <Card 
      className="px-6 py-4 hover:border-blue-500/50 transition-all group/card" 
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 group-hover/card:bg-slate-700 transition-colors">
            {getFileIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-white group-hover/card:text-blue-400 transition-colors">{doc.filename}</p>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover/card:text-blue-400 opacity-0 group-hover/card:opacity-100 transition-all -translate-x-2 group-hover/card:translate-x-0" />
            </div>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={doc.status} />
              <span className="text-xs text-slate-500">{doc.total_segments || 0} segments</span>
              <span className="text-xs text-slate-500">{formatDate(doc.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {renderActions()}
          <button 
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors ml-2"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete Document"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
};

export default ProjectDetail;
