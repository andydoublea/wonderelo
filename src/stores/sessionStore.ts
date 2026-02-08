import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { debugLog } from '../utils/debug';

/**
 * Session Store
 * Manages current session state and operations
 */

export interface Session {
  id: string;
  userId: string;
  slug: string;
  title: string;
  description: string;
  location?: string;
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants?: number;
  settings?: {
    allowLateRegistration?: boolean;
    requireEmailVerification?: boolean;
    autoMatch?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Round {
  id: string;
  sessionId: string;
  roundNumber: number;
  title: string;
  startTime: string;
  endTime: string;
  meetingPointId?: string;
  tableCount?: number;
  participantsPerTable?: number;
  iceBreakers?: string[];
  status: 'upcoming' | 'active' | 'completed';
}

interface SessionState {
  // Current session
  currentSession: Session | null;
  currentSessionId: string | null;
  
  // Rounds
  rounds: Round[];
  currentRoundId: string | null;
  
  // Filters & UI
  filterStatus: 'all' | 'upcoming' | 'active' | 'completed';
  searchQuery: string;
  sortBy: 'date' | 'title' | 'participants';
  sortOrder: 'asc' | 'desc';
  
  // Loading
  isLoadingSession: boolean;
  isLoadingRounds: boolean;
  
  // Actions
  setCurrentSession: (session: Session | null) => void;
  setCurrentSessionId: (id: string | null) => void;
  setRounds: (rounds: Round[]) => void;
  addRound: (round: Round) => void;
  updateRound: (roundId: string, updates: Partial<Round>) => void;
  removeRound: (roundId: string) => void;
  setCurrentRoundId: (id: string | null) => void;
  
  // Filters
  setFilterStatus: (status: 'all' | 'upcoming' | 'active' | 'completed') => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: 'date' | 'title' | 'participants') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  
  // Loading
  setIsLoadingSession: (loading: boolean) => void;
  setIsLoadingRounds: (loading: boolean) => void;
  
  // Computed
  getCurrentRound: () => Round | null;
  getActiveRound: () => Round | null;
  getUpcomingRounds: () => Round[];
  getFilteredRounds: () => Round[];
  
  // Reset
  reset: () => void;
}

const initialState = {
  currentSession: null,
  currentSessionId: null,
  rounds: [],
  currentRoundId: null,
  filterStatus: 'all' as const,
  searchQuery: '',
  sortBy: 'date' as const,
  sortOrder: 'asc' as const,
  isLoadingSession: false,
  isLoadingRounds: false
};

export const useSessionStore = create<SessionState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,
      
      // Actions
      setCurrentSession: (session) => {
        set({ currentSession, currentSessionId: session?.id || null });
        debugLog('Current session set:', session?.title);
      },
      
      setCurrentSessionId: (id) => {
        set({ currentSessionId: id });
      },
      
      setRounds: (rounds) => {
        set({ rounds });
        debugLog('Rounds updated:', rounds.length);
      },
      
      addRound: (round) => {
        set((state) => ({
          rounds: [...state.rounds, round].sort((a, b) => a.roundNumber - b.roundNumber)
        }));
        debugLog('Round added:', round.title);
      },
      
      updateRound: (roundId, updates) => {
        set((state) => ({
          rounds: state.rounds.map((round) =>
            round.id === roundId ? { ...round, ...updates } : round
          )
        }));
        debugLog('Round updated:', roundId);
      },
      
      removeRound: (roundId) => {
        set((state) => ({
          rounds: state.rounds.filter((round) => round.id !== roundId)
        }));
        debugLog('Round removed:', roundId);
      },
      
      setCurrentRoundId: (id) => {
        set({ currentRoundId: id });
      },
      
      // Filters
      setFilterStatus: (status) => {
        set({ filterStatus: status });
      },
      
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },
      
      setSortBy: (sortBy) => {
        set({ sortBy });
      },
      
      setSortOrder: (order) => {
        set({ sortOrder: order });
      },
      
      // Loading
      setIsLoadingSession: (loading) => {
        set({ isLoadingSession: loading });
      },
      
      setIsLoadingRounds: (loading) => {
        set({ isLoadingRounds: loading });
      },
      
      // Computed
      getCurrentRound: () => {
        const { rounds, currentRoundId } = get();
        return rounds.find((r) => r.id === currentRoundId) || null;
      },
      
      getActiveRound: () => {
        const { rounds } = get();
        return rounds.find((r) => r.status === 'active') || null;
      },
      
      getUpcomingRounds: () => {
        const { rounds } = get();
        return rounds.filter((r) => r.status === 'upcoming');
      },
      
      getFilteredRounds: () => {
        const { rounds, filterStatus, searchQuery, sortBy, sortOrder } = get();
        
        let filtered = rounds;
        
        // Filter by status
        if (filterStatus !== 'all') {
          filtered = filtered.filter((r) => r.status === filterStatus);
        }
        
        // Search
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter((r) =>
            r.title.toLowerCase().includes(query)
          );
        }
        
        // Sort
        filtered.sort((a, b) => {
          let comparison = 0;
          
          if (sortBy === 'date') {
            comparison = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
          } else if (sortBy === 'title') {
            comparison = a.title.localeCompare(b.title);
          }
          
          return sortOrder === 'asc' ? comparison : -comparison;
        });
        
        return filtered;
      },
      
      // Reset
      reset: () => {
        set(initialState);
        debugLog('Session store reset');
      }
    })),
    { name: 'SessionStore' }
  )
);

/**
 * Selectors
 */
export const useCurrentSession = () => useSessionStore((state) => state.currentSession);
export const useRounds = () => useSessionStore((state) => state.rounds);
export const useCurrentRound = () => useSessionStore((state) => state.getCurrentRound());
export const useActiveRound = () => useSessionStore((state) => state.getActiveRound());
export const useFilteredRounds = () => useSessionStore((state) => state.getFilteredRounds());

/**
 * Subscribe to session changes
 */
export const subscribeToSession = (callback: (session: Session | null) => void) => {
  return useSessionStore.subscribe(
    (state) => state.currentSession,
    callback,
    { fireImmediately: true }
  );
};
