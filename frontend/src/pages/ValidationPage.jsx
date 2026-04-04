import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Check,
  Loader2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { getValidationReport, resolveIssue } from '../lib/api/documents';
import Card from '../components/ui/Card';
import Stat from '../components/ui/Stat';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import { toast } from '../hooks/useToast';

const FILTER_TABS = ['all', 'high', 'medium', 'low', 'resolved'];

const ValidationPage = () => {
  const { projectId, documentId } = useParams();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [localIssues, setLocalIssues] = useState(null);
  const [resolvingIds, setResolvingIds] = useState(new Set());
  const [bulkResolving, setBulkResolving] = useState(false);

  const { data: report, isLoading, isError } = useQuery({
    queryKey: ['validation-report', projectId, documentId],
    queryFn: () => getValidationReport(projectId, documentId),
    onSuccess: (data) => {
      if (!localIssues) setLocalIssues(data.issues);
    },
  });

  // Use local issues for optimistic UI, fall back to server data
  const issues = localIssues || report?.issues || [];

  // Sync local state when server data arrives (only on first load)
  React.useEffect(() => {
    if (report?.issues && !localIssues) {
      setLocalIssues(report.issues);
    }
  }, [report]);

  // Computed
  const highCount = useMemo(() => issues.filter((i) => i.severity === 'high' && !i.is_resolved).length, [issues]);
  const mediumCount = useMemo(() => issues.filter((i) => i.severity === 'medium' && !i.is_resolved).length, [issues]);
  const lowCount = useMemo(() => issues.filter((i) => i.severity === 'low' && !i.is_resolved).length, [issues]);
  const resolvedCount = useMemo(() => issues.filter((i) => i.is_resolved).length, [issues]);
  const totalIssues = issues.length;
  const resolvedPercent = totalIssues > 0 ? (resolvedCount / totalIssues) * 100 : 100;
  const allHighResolved = highCount === 0;

  // Filtered list
  const filteredIssues = useMemo(() => {
    switch (activeFilter) {
      case 'high': return issues.filter((i) => i.severity === 'high' && !i.is_resolved);
      case 'medium': return issues.filter((i) => i.severity === 'medium' && !i.is_resolved);
      case 'low': return issues.filter((i) => i.severity === 'low' && !i.is_resolved);
      case 'resolved': return issues.filter((i) => i.is_resolved);
      default: return issues;
    }
  }, [issues, activeFilter]);

  // Quality score color
  const getScoreColor = () => {
    const unresolved = totalIssues - resolvedCount;
    if (unresolved <= 2) return 'text-green-400';
    if (unresolved <= 7) return 'text-amber-400';
    return 'text-red-400';
  };

  // Resolve single issue (optimistic)
  const handleResolve = async (issueId) => {
    // Optimistic update
    setLocalIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, is_resolved: true } : i))
    );
    setResolvingIds((prev) => new Set([...prev, issueId]));

    try {
      await resolveIssue(projectId, documentId, issueId);
      toast('Issue resolved', 'success');
    } catch {
      // Revert on error
      setLocalIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, is_resolved: false } : i))
      );
      toast('Failed to resolve issue', 'error');
    } finally {
      setResolvingIds((prev) => {
        const next = new Set(prev);
        next.delete(issueId);
        return next;
      });
    }
  };

  // Bulk resolve all low severity
  const handleResolveAllLow = async () => {
    const lowIssues = issues.filter((i) => i.severity === 'low' && !i.is_resolved);
    if (lowIssues.length === 0) return toast('No low severity issues to resolve', 'info');

    setBulkResolving(true);
    // Optimistic update
    setLocalIssues((prev) =>
      prev.map((i) => (i.severity === 'low' ? { ...i, is_resolved: true } : i))
    );

    let failed = 0;
    for (const issue of lowIssues) {
      try {
        await resolveIssue(projectId, documentId, issue.id);
      } catch {
        failed++;
      }
    }

    if (failed > 0) {
      toast(`${failed} issues failed to resolve`, 'error');
      // Refetch to get accurate state
      setLocalIssues(null);
    } else {
      toast(`${lowIssues.length} low severity issues resolved`, 'success');
    }
    setBulkResolving(false);
  };

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 bg-slate-700 rounded animate-pulse" />
          <div className="h-7 bg-slate-700 rounded w-64 animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-3 bg-slate-700 rounded w-24" />
                <div className="h-8 bg-slate-700 rounded w-12" />
              </div>
            </Card>
          ))}
        </div>
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-800 rounded-lg" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // Error
  if (isError) {
    return (
      <div className="space-y-6">
        <Link to={`/projects/${projectId}`} className="inline-flex items-center text-slate-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Project
        </Link>
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Failed to load validation report</h3>
          <p className="text-slate-400">The validation report could not be fetched. Try running validation again.</p>
        </Card>
      </div>
    );
  }

  // Empty (no issues found) — clean document
  if (totalIssues === 0) {
    return (
      <div className="space-y-6">
        <Link to={`/projects/${projectId}`} className="inline-flex items-center text-slate-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Project
        </Link>
        <Card className="p-16 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white mb-2">No issues found</h2>
          <p className="text-slate-400 max-w-md mb-8">
            Your source document is clean and ready for translation.
          </p>
          <Button variant="primary" size="lg" onClick={() => navigate(`/projects/${projectId}`)}>
            <Sparkles className="w-5 h-5 mr-2" />
            Proceed to Translation
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to={`/projects/${projectId}`} className="inline-flex items-center text-slate-400 hover:text-white transition-colors text-sm mb-3">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Project
          </Link>
          <h1 className="font-display text-[28px] font-bold text-white">Source Quality Validation</h1>
          <p className="text-slate-400 mt-1">Review and resolve issues before translation</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Quality Score</p>
          <p className={`text-4xl font-display font-bold ${getScoreColor()}`}>
            {totalIssues - resolvedCount === 0 ? '✓' : totalIssues - resolvedCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">unresolved issues</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Stat label="High Severity" value={highCount} subtitle="Must fix before translation" icon={AlertTriangle} color="red" />
        <Stat label="Medium Severity" value={mediumCount} subtitle="Should review" icon={AlertCircle} color="amber" />
        <Stat label="Low Severity" value={lowCount} subtitle="Minor suggestions" icon={Info} color="blue" />
      </div>

      {/* Progress */}
      <Card className="px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">Issues Resolved</span>
          <span className="text-sm text-slate-400">{resolvedCount} of {totalIssues}</span>
        </div>
        <ProgressBar
          value={resolvedPercent}
          color={resolvedPercent === 100 ? 'green' : resolvedPercent > 50 ? 'amber' : 'blue'}
        />
      </Card>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-[#1E3A5F]/30">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab;
          const count = tab === 'all' ? totalIssues
            : tab === 'resolved' ? resolvedCount
            : tab === 'high' ? highCount
            : tab === 'medium' ? mediumCount
            : lowCount;

          return (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors relative
                ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'}
              `}
            >
              {tab}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                {count}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-t" />
              )}
            </button>
          );
        })}
      </div>

      {/* Issue List */}
      {filteredIssues.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400">No issues in this category.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              isResolving={resolvingIds.has(issue.id)}
              onResolve={() => handleResolve(issue.id)}
            />
          ))}
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-[240px] right-0 bg-[#0A1628]/95 backdrop-blur-sm border-t border-[#1E3A5F] px-6 py-3 z-10">
        <div className="flex items-center justify-between max-w-full">
          <span className="text-sm text-slate-400">
            <span className="text-white font-medium">{resolvedCount}</span> of {totalIssues} issues resolved
          </span>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleResolveAllLow}
              loading={bulkResolving}
              disabled={lowCount === 0}
            >
              Resolve All Low Severity
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!allHighResolved}
              onClick={() => navigate(`/projects/${projectId}`)}
            >
              Proceed to Translation <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Issue Card sub-component
const IssueCard = ({ issue, isResolving, onResolve }) => {
  const borderColor = {
    high: 'border-l-red-500',
    medium: 'border-l-amber-500',
    low: 'border-l-slate-500',
  };

  return (
    <Card className={`border-l-4 ${borderColor[issue.severity] || borderColor.low} ${issue.is_resolved ? 'opacity-60' : ''}`}>
      <div className="px-5 py-4 space-y-3">
        {/* Top row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {issue.issue_type}
            </span>
            <Badge variant={issue.severity}>{issue.severity}</Badge>
            {issue.is_resolved && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <Check className="w-3.5 h-3.5" /> Resolved
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-white">{issue.description}</p>

        {/* Original Text */}
        {issue.original_text && (
          <div className="bg-[#0A1628] border border-[#1E3A5F]/30 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">Problematic Text</p>
            <p className="text-sm font-mono text-slate-300">{issue.original_text}</p>
          </div>
        )}

        {/* Suggested Fix */}
        {issue.suggested_fix && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-green-500/70 mb-1">Suggested Fix</p>
            <p className="text-sm text-green-300/80">{issue.suggested_fix}</p>
          </div>
        )}

        {/* Action row */}
        {!issue.is_resolved && (
          <div className="flex justify-end pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onResolve}
              loading={isResolving}
            >
              <Check className="w-3.5 h-3.5 mr-1.5" />
              Mark Resolved
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ValidationPage;
