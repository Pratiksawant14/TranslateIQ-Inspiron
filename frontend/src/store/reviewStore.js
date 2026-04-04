import { create } from 'zustand';

const useReviewStore = create((set, get) => ({
  segments: [],
  selectedSegmentId: null,
  filter: 'all',

  setSegments: (segments) => set({ segments }),

  updateSegment: (segmentId, updates) =>
    set((state) => ({
      segments: state.segments.map((s) =>
        s.id === segmentId ? { ...s, ...updates } : s
      ),
    })),

  setSelectedSegment: (id) => set({ selectedSegmentId: id }),

  setFilter: (filter) => set({ filter }),

  // Computed getters
  getFilteredSegments: () => {
    const { segments, filter } = get();
    switch (filter) {
      case 'pending':
        return segments.filter((s) => s.status === 'pending');
      case 'approved':
        return segments.filter((s) => s.status === 'approved');
      case 'rejected':
        return segments.filter((s) => s.status === 'rejected');
      case 'low_confidence':
        return segments.filter(
          (s) => s.status === 'pending' && (s.confidence_score || 0) < 0.7
        );
      default:
        return segments;
    }
  },

  getStats: () => {
    const { segments } = get();
    const total = segments.length;
    const approved = segments.filter((s) => s.status === 'approved').length;
    const pending = segments.filter((s) => s.status === 'pending').length;
    const rejected = segments.filter((s) => s.status === 'rejected').length;
    const completion = total > 0 ? (approved / total) * 100 : 0;
    return { total, approved, pending, rejected, completion };
  },
}));

export default useReviewStore;
