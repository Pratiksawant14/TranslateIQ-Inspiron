import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  X,
  Pencil,
  Download,
  Loader2,
  AlertCircle,
  Undo2,
  Sparkles,
  ChevronDown,
  CheckSquare,
} from 'lucide-react';
import {
  getReviewSession,
  acceptSegment,
  editSegment,
  rejectSegment,
  exportDocument,
} from '../lib/api/review';
import useReviewStore from '../store/reviewStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import { toast } from '../hooks/useToast';

const ReviewEditor = () => {
  const { projectId, documentId } = useParams();
  const queryClient = useQueryClient();
  const segmentRefs = useRef({});
  const [exporting, setExporting] = useState(false);
  const [bulkAccepting, setBulkAccepting] = useState(false);

  const {
    segments,
    selectedSegmentId,
    filter,
    setSegments,
    updateSegment,
    setSelectedSegment,
    setFilter,
    getFilteredSegments,
    getStats,
  } = useReviewStore();

  // Fetch review session
  const { data, isLoading, isError } = useQuery({
    queryKey: ['review-session', projectId, documentId],
    queryFn: () => getReviewSession(projectId, documentId),
  });

  // Extract target language from data
  const targetLanguage = data?.target_language;
  
  // Sync on data load
  useEffect(() => {
    if (data?.segments) {
      setSegments(data.segments);
      if (!selectedSegmentId && data.segments.length > 0) {
        setSelectedSegment(data.segments[0].id);
      }
    }
  }, [data, setSegments, selectedSegmentId, setSelectedSegment]);

  // Sync on data load
  useEffect(() => {
    return () => {
      setSegments([]);
      setSelectedSegment(null);
      setFilter('all');
    };
  }, []);

  const filteredSegments = getFilteredSegments();
  const stats = getStats();
  const selectedSegment = segments.find((s) => s.id === selectedSegmentId);

  // Scroll to segment
  const scrollToSegment = useCallback((id) => {
    setSelectedSegment(id);
    segmentRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // Accept handler
  const handleAccept = async (segmentId) => {
    updateSegment(segmentId, { status: 'approved' });
    try {
      await acceptSegment(segmentId, targetLanguage);
      queryClient.invalidateQueries(['review-session', projectId, documentId]);
      toast('Segment approved', 'success');
    } catch (error) {
      console.error('Accept failed:', error);
      updateSegment(segmentId, { status: 'pending' });
      toast('Failed to approve', 'error');
    }
  };

  // Reject handler
  const handleReject = async (segmentId) => {
    const prev = segments.find((s) => s.id === segmentId)?.status;
    updateSegment(segmentId, { status: 'rejected' });
    try {
      await rejectSegment(segmentId);
      queryClient.invalidateQueries(['review-session', projectId, documentId]);
      toast('Segment rejected', 'info');
    } catch {
      updateSegment(segmentId, { status: prev || 'pending' });
      toast('Failed to reject', 'error');
    }
  };

  // Edit handler
  const handleEdit = async (segmentId, newText) => {
    const prevText = segments.find((s) => s.id === segmentId)?.translated_text;
    updateSegment(segmentId, { status: 'approved', translated_text: newText });
    try {
      await editSegment(segmentId, newText, targetLanguage);
      queryClient.invalidateQueries(['review-session', projectId, documentId]);
      toast('Segment edited and approved', 'success');
    } catch (error) {
      console.error('Edit failed:', error);
      updateSegment(segmentId, { status: 'pending', translated_text: prevText });
      toast('Failed to save edit', 'error');
    }
  };

  // Undo (revert to pending)
  const handleUndo = async (segmentId) => {
    updateSegment(segmentId, { status: 'pending' });
  };

  // Bulk accept high confidence
  const handleBulkAccept = async () => {
    const highConf = segments.filter(
      (s) => s.status === 'pending' && (s.confidence_score || 0) >= 0.85
    );
    if (highConf.length === 0) return toast('No high-confidence pending segments', 'info');

    setBulkAccepting(true);
    highConf.forEach((s) => updateSegment(s.id, { status: 'approved' }));

    let failed = 0;
    for (const seg of highConf) {
      try {
        await acceptSegment(seg.id, targetLanguage);
      } catch (error) {
        console.error('Bulk accept failed for segment:', seg.id, error);
        failed++;
        updateSegment(seg.id, { status: 'pending' });
      }
    }

    if (failed > 0) {
      toast(`${highConf.length - failed} accepted, ${failed} failed`, 'error');
    } else {
      toast(`${highConf.length} high-confidence segments accepted`, 'success');
    }
    queryClient.invalidateQueries(['review-session', projectId, documentId]);
    setBulkAccepting(false);
  };

  // Export handler
  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await exportDocument(projectId, documentId);
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'translated_document.docx';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast('Document exported successfully', 'success');
    } catch {
      toast('Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-400">Loading review session...</p>
        </div>
      </div>
    );
  }

  // Error
  if (isError) {
    return (
      <div className="space-y-6">
        <Link to={`/projects/${projectId}`} className="inline-flex items-center text-slate-400 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Project
        </Link>
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Failed to load review session</h3>
          <p className="text-slate-400">Run the scoring step first before opening the editor.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] -m-6">
      {/* Top Bar */}
      <div className="bg-[#0F1B2D] border-b border-[#1E3A5F] px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link to={`/projects/${projectId}`} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="font-display font-semibold text-white text-lg">Review Editor</h2>
            <p className="text-xs text-slate-500">Segment-by-segment translation review</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-40">
              <ProgressBar value={stats.completion} color={stats.completion === 100 ? 'green' : 'blue'} />
            </div>
            <span className="text-sm text-slate-300 whitespace-nowrap">
              {stats.approved} / {stats.total}
            </span>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExport}
            disabled={stats.completion < 100}
            loading={exporting}
          >
            <Download className="w-4 h-4 mr-1.5" /> Export DOCX
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <div className="bg-[#0A1628] border-b border-[#1E3A5F]/50 px-6 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBulkAccept}
            loading={bulkAccepting}
          >
            <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
            Accept All High Confidence
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {['all', 'pending', 'approved', 'rejected', 'low_confidence'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors
                ${filter === f
                  ? 'bg-[#2563EB]/20 text-blue-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }
              `}
            >
              {f === 'low_confidence' ? 'Low Confidence' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel — Segment Navigator */}
        <div className="w-[220px] bg-[#0F1B2D] border-r border-[#1E3A5F]/50 overflow-y-auto shrink-0">
          <div className="p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Segments</p>
            {segments.map((seg) => {
              const isActive = seg.id === selectedSegmentId;
              const dotColor = seg.status === 'approved' ? 'bg-green-500'
                : seg.status === 'rejected' ? 'bg-red-500'
                : 'bg-amber-400';

              return (
                <button
                  key={seg.id}
                  onClick={() => scrollToSegment(seg.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg mb-0.5 flex items-center gap-2 transition-all text-xs
                    ${isActive
                      ? 'bg-[#2563EB]/10 border-l-2 border-l-[#2563EB] text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-l-2 border-l-transparent'
                    }
                  `}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                  <span className="font-mono text-slate-500 w-5 shrink-0">#{seg.segment_index}</span>
                  <span className="truncate">{seg.source_text?.substring(0, 40)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Panel — Main Editor */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredSegments.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-slate-400">No segments match the current filter.</p>
            </Card>
          ) : (
            filteredSegments.map((seg) => (
              <div
                key={seg.id}
                ref={(el) => (segmentRefs.current[seg.id] = el)}
                onClick={() => setSelectedSegment(seg.id)}
              >
                <SegmentCard
                  segment={seg}
                  isSelected={seg.id === selectedSegmentId}
                  onAccept={() => handleAccept(seg.id)}
                  onReject={() => handleReject(seg.id)}
                  onEdit={(text) => handleEdit(seg.id, text)}
                  onUndo={() => handleUndo(seg.id)}
                />
              </div>
            ))
          )}
        </div>

        {/* Right Panel — Segment Details */}
        <div className="w-[280px] bg-[#0F1B2D] border-l border-[#1E3A5F]/50 overflow-y-auto shrink-0">
          {selectedSegment ? (
            <SegmentDetails segment={selectedSegment} />
          ) : (
            <div className="p-6 text-center text-slate-500 text-sm">
              Select a segment to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Segment Card ────────────────────────────────────
const SegmentCard = ({ segment, isSelected, onAccept, onReject, onEdit, onUndo }) => {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const startEdit = () => {
    setEditText(segment.translated_text || '');
    setEditing(true);
  };

  const saveEdit = async () => {
    setActionLoading('edit');
    await onEdit(editText);
    setEditing(false);
    setActionLoading(null);
  };

  const handleAccept = async () => {
    setActionLoading('accept');
    await onAccept();
    setActionLoading(null);
  };

  const handleReject = async () => {
    setActionLoading('reject');
    await onReject();
    setActionLoading(null);
  };

  const confidenceColor = (segment.confidence_score || 0) >= 0.85
    ? 'text-green-400' : (segment.confidence_score || 0) >= 0.7
    ? 'text-amber-400' : 'text-red-400';

  return (
    <Card className={`transition-all ${isSelected ? 'ring-1 ring-[#2563EB]/50' : ''}`}>
      {/* Header */}
      <div className="px-5 py-3 border-b border-[#1E3A5F]/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500">#{segment.segment_index}</span>
          {segment.content_type && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{segment.content_type}</span>
          )}
          {segment.tm_match_type && (
            <Badge variant={segment.tm_match_type}>{segment.tm_match_type}</Badge>
          )}
        </div>
        {segment.confidence_score != null && (
          <span className={`text-xs font-medium ${confidenceColor}`}>
            {(segment.confidence_score * 100).toFixed(0)}% confidence
          </span>
        )}
      </div>

      {/* Source and Translation Side by Side */}
      <div className="grid grid-cols-2 divide-x divide-[#1E3A5F]/30">
        {/* Source */}
        <div className="p-5">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Source</p>
          <p className="text-sm text-slate-200 leading-relaxed bg-[#0F1B2D] rounded-lg p-3">
            {segment.source_text}
          </p>
        </div>
        {/* Translation */}
        <div className="p-5">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Translation</p>
          {editing ? (
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={4}
              className="w-full bg-[#0A1628] border border-[#2563EB] rounded-lg p-3 text-sm text-white resize-none
                focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              autoFocus
            />
          ) : (
            <p className={`text-sm leading-relaxed rounded-lg p-3 ${
              segment.translated_text ? 'text-white bg-[#0A1628]' : 'text-slate-500 italic bg-[#0A1628]'
            }`}>
              {segment.translated_text || 'No translation yet'}
            </p>
          )}
        </div>
      </div>

      {/* Action Row */}
      <div className="px-5 py-3 border-t border-[#1E3A5F]/30 flex items-center justify-between">
        {editing ? (
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            <Button variant="success" size="sm" onClick={saveEdit} loading={actionLoading === 'edit'}>
              <Check className="w-3.5 h-3.5 mr-1" /> Save
            </Button>
          </div>
        ) : segment.status === 'pending' ? (
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="success" size="sm" onClick={handleAccept} loading={actionLoading === 'accept'}>
              <Check className="w-3.5 h-3.5 mr-1" /> Accept
            </Button>
            <Button variant="secondary" size="sm" onClick={startEdit}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReject} loading={actionLoading === 'reject'}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
              <X className="w-3.5 h-3.5 mr-1" /> Reject
            </Button>
          </div>
        ) : segment.status === 'approved' ? (
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1.5 text-sm text-green-400">
              <Check className="w-4 h-4" /> Approved
            </span>
            <Button variant="ghost" size="sm" onClick={onUndo}>
              <Undo2 className="w-3.5 h-3.5 mr-1" /> Undo
            </Button>
          </div>
        ) : segment.status === 'rejected' ? (
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1.5 text-sm text-red-400">
              <X className="w-4 h-4" /> Rejected
            </span>
            <Button variant="ghost" size="sm" onClick={onUndo}>
              <Undo2 className="w-3.5 h-3.5 mr-1" /> Undo
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
};

// ─── Segment Details Panel ──────────────────────────
const SegmentDetails = ({ segment }) => {
  const confScore = segment.confidence_score || 0;
  const confColor = confScore >= 0.85 ? 'text-green-400'
    : confScore >= 0.7 ? 'text-amber-400' : 'text-red-400';
  const confBg = confScore >= 0.85 ? 'bg-green-500/10'
    : confScore >= 0.7 ? 'bg-amber-500/10' : 'bg-red-500/10';

  return (
    <div className="p-5 space-y-5">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Details</p>

        {/* Match Type */}
        {segment.tm_match_type && (
          <div className="mb-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Match Type</p>
            <Badge variant={segment.tm_match_type}>{segment.tm_match_type}</Badge>
          </div>
        )}

        {/* Confidence */}
        <div className="mb-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Confidence Score</p>
          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${confBg}`}>
            <span className={`text-2xl font-display font-bold ${confColor}`}>
              {(confScore * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="mb-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Status</p>
          <Badge variant={segment.status === 'approved' ? 'approved' : segment.status === 'rejected' ? 'rejected' : 'pending'}>
            {segment.status}
          </Badge>
        </div>

        {/* Segment Index */}
        <div className="mb-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Segment Index</p>
          <p className="text-sm text-white font-mono">#{segment.segment_index}</p>
        </div>
      </div>

      {/* TM Match Info */}
      {segment.tm_match_type && segment.tm_match_type !== 'new' && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">TM Match</p>
          <div className="bg-[#0A1628] border border-[#1E3A5F]/30 rounded-lg p-3 space-y-2">
            <div>
              <p className="text-[10px] text-slate-500 uppercase mb-0.5">Source</p>
              <p className="text-xs text-slate-300">{segment.source_text}</p>
            </div>
            {segment.translated_text && (
              <div>
                <p className="text-[10px] text-slate-500 uppercase mb-0.5">Target</p>
                <p className="text-xs text-green-300">{segment.translated_text}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Type */}
      {segment.content_type && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Content Type</p>
          <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300">{segment.content_type}</span>
        </div>
      )}
    </div>
  );
};

export default ReviewEditor;
