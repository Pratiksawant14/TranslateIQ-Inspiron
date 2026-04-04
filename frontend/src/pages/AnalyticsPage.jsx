import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  ShieldCheck, 
  Database,
  BrainCircuit,
  Info,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { getProjects } from '../lib/api/projects';
import { getProjectAnalytics } from '../lib/api/analytics';
import Card from '../components/ui/Card';
import Stat from '../components/ui/Stat';
import Badge from '../components/ui/Badge';
import Select from '../components/ui/Select';
import ProgressBar from '../components/ui/ProgressBar';

const AnalyticsPage = () => {
  const [selectedProjectId, setSelectedProjectId] = useState('');

  // Fetch projects for selector
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  // Set default project
  useEffect(() => {
    if (projects?.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  // Fetch analytics for selected project
  const { data: analytics, isLoading: analyticsLoading, isError } = useQuery({
    queryKey: ['analytics', selectedProjectId],
    queryFn: () => getProjectAnalytics(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const projectOptions = projects?.map(p => ({ value: p.id, label: p.name })) || [];

  const tmLeverage = analytics ? 
    ((analytics.exact_matches + analytics.fuzzy_matches) / (analytics.total_segments || 1) * 100).toFixed(1) : 0;

  const getReadinessBadge = (count) => {
    if (count >= 500) return <Badge variant="approved">Ready</Badge>;
    if (count >= 100) return <Badge variant="pending">Collecting</Badge>;
    return <Badge variant="rejected">Insufficient Data</Badge>;
  };

  const calculatePercent = (val) => {
    if (!analytics || !analytics.total_segments) return 0;
    return ((val / analytics.total_segments) * 100).toFixed(1);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-bold text-white">Analytics</h1>
          <p className="text-slate-400 mt-1">Translation performance and quality metrics</p>
        </div>
        <div className="w-64">
          <Select 
            options={projectOptions}
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            placeholder="Select a project"
          />
        </div>
      </div>

      {!selectedProjectId ? (
        <Card className="p-16 flex flex-col items-center justify-center text-center bg-[#0F1B2D]/50 border-dashed border-2 border-[#1E3A5F]">
          <BarChart3 className="w-16 h-16 text-slate-600 mb-4" />
          <h3 className="text-xl font-display font-semibold text-slate-300">Select a project to view analytics</h3>
          <p className="text-slate-500 mt-2 max-w-sm">
            Choose a project from the dropdown above to analyze its translation memory leverage, quality scores, and learning progress.
          </p>
        </Card>
      ) : analyticsLoading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-4 gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-800/50 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-2 gap-6 animate-pulse">
            <div className="h-64 bg-slate-800/50 rounded-xl" />
            <div className="h-64 bg-slate-800/50 rounded-xl" />
          </div>
        </div>
      ) : isError ? (
        <Card className="p-12 text-center border-red-500/20 bg-red-500/5">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white">Failed to load analytics</h3>
          <p className="text-slate-400 mt-2">There was an error fetching the metrics for this project.</p>
        </Card>
      ) : (
        <>
          {/* Top Stat Row */}
          <div className="grid grid-cols-4 gap-6">
            <Stat 
              label="TM Leverage Rate" 
              value={`${tmLeverage}%`}
              icon={TrendingUp}
              color="green"
            />
            <Stat 
              label="Segments Approved" 
              value={`${analytics.approved_count} / ${analytics.total_segments}`}
              subtitle={`${analytics.completion_percentage}% complete`}
              icon={CheckCircle2}
              color="blue"
            />
            <Stat 
              label="Avg Confidence Score" 
              value={analytics.avg_confidence?.toFixed(2) || '0.00'}
              icon={ShieldCheck}
              color={analytics.avg_confidence >= 0.85 ? 'green' : analytics.avg_confidence >= 0.7 ? 'amber' : 'red'}
            />
            <Stat 
              label="TM Entries" 
              value={analytics.tm_entries_count.toLocaleString()}
              icon={Database}
              color="indigo"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Segment Breakdown */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-semibold text-white">Segment Breakdown</h3>
                <Info className="w-4 h-4 text-slate-500" />
              </div>
              
              <div className="space-y-6">
                {/* Exact Matches */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-medium text-slate-400 w-32">Exact Matches</span>
                    <span className="text-xs font-mono text-green-400">{analytics.exact_matches} ({calculatePercent(analytics.exact_matches)}%)</span>
                  </div>
                  <ProgressBar value={parseFloat(calculatePercent(analytics.exact_matches))} color="green" />
                </div>

                {/* Fuzzy Matches */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-medium text-slate-400 w-32">Fuzzy Matches</span>
                    <span className="text-xs font-mono text-amber-400">{analytics.fuzzy_matches} ({calculatePercent(analytics.fuzzy_matches)}%)</span>
                  </div>
                  <ProgressBar value={parseFloat(calculatePercent(analytics.fuzzy_matches))} color="amber" />
                </div>

                {/* New Segments */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-medium text-slate-400 w-32">New Segments</span>
                    <span className="text-xs font-mono text-red-400">{analytics.new_segments} ({calculatePercent(analytics.new_segments)}%)</span>
                  </div>
                  <ProgressBar value={parseFloat(calculatePercent(analytics.new_segments))} color="red" />
                </div>
              </div>
              <p className="mt-8 text-xs text-slate-500 leading-relaxed italic">
                TM Leverage represents the percentage of content recycled from your Translation Memory, significantly reducing effort and cost.
              </p>
            </Card>

            {/* Learning Pipeline */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-semibold text-white">Continuous Learning Pipeline</h3>
                <BrainCircuit className="w-5 h-5 text-blue-400" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-[#0F1B2D] p-5 rounded-xl border border-[#1E3A5F]/30 hover:border-[#2563EB]/40 transition-colors">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Training Signals Collected</p>
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-display font-bold text-white leading-none">
                      {analytics.telemetry_count.toLocaleString()}
                    </span>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 uppercase mb-1">Status</p>
                      {getReadinessBadge(analytics.telemetry_count)}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                    Signals consist of human-reviewed high-quality translations used to fine-tune your project's custom LLM.
                  </p>
                </div>

                <div className="bg-[#0F1B2D] p-5 rounded-xl border border-[#1E3A5F]/30 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Fine-tuning Readiness</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {analytics.telemetry_count >= 500 
                        ? "You have collected sufficient data to initiate a custom fine-tuning run for this project's tone profile." 
                        : `Collect ${500 - analytics.telemetry_count} more human-reviewed segments to reach the 500 signal threshold for optimal fine-tuning quality.`}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
