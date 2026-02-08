import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import { debugLog } from '../utils/debug';

/**
 * Participant Store
 * Manages participant dashboard state and data
 */

export interface Participant {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  position?: string;
  participantToken: string;
  registeredAt: string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'no_show';
}

export interface ParticipantRound {
  id: string;
  roundId: string;
  participantId: string;
  roundNumber: number;
  roundTitle: string;
  startTime: string;
  endTime: string;
  tableNumber?: number;
  meetingPoint?: string;
  matchedParticipantId?: string;
  matchedParticipant?: {
    firstName: string;
    lastName: string;
    company?: string;
    position?: string;
  };
  status: 'upcoming' | 'active' | 'completed' | 'missed';
  iceBreakers?: string[];
}

export interface Contact {
  id: string;
  participantId: string;
  contactedParticipantId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  roundNumber: number;
  metAt: string;
  notes?: string;
}

interface ParticipantState {
  // Current participant (from token)
  currentParticipant: Participant | null;
  participantToken: string | null;
  
  // Participant rounds
  rounds: ParticipantRound[];
  
  // Contacts
  contacts: Contact[];
  
  // UI state
  activeTab: 'dashboard' | 'rounds' | 'contacts' | 'profile';
  
  // Loading
  isLoadingParticipant: boolean;
  isLoadingRounds: boolean;
  isLoadingContacts: boolean;
  
  // Actions
  setCurrentParticipant: (participant: Participant | null) => void;
  setParticipantToken: (token: string | null) => void;
  setRounds: (rounds: ParticipantRound[]) => void;
  updateRoundStatus: (roundId: string, status: ParticipantRound['status']) => void;
  setContacts: (contacts: Contact[]) => void;
  addContact: (contact: Contact) => void;
  updateContact: (contactId: string, updates: Partial<Contact>) => void;
  removeContact: (contactId: string) => void;
  setActiveTab: (tab: 'dashboard' | 'rounds' | 'contacts' | 'profile') => void;
  
  // Loading
  setIsLoadingParticipant: (loading: boolean) => void;
  setIsLoadingRounds: (loading: boolean) => void;
  setIsLoadingContacts: (loading: boolean) => void;
  
  // Computed
  getUpcomingRounds: () => ParticipantRound[];
  getActiveRound: () => ParticipantRound | null;
  getCompletedRounds: () => ParticipantRound[];
  getNextRound: () => ParticipantRound | null;
  
  // Reset
  reset: () => void;
}

const initialState = {
  currentParticipant: null,
  participantToken: null,
  rounds: [],
  contacts: [],
  activeTab: 'dashboard' as const,
  isLoadingParticipant: false,
  isLoadingRounds: false,
  isLoadingContacts: false
};

export const useParticipantStore = create<ParticipantState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Actions
        setCurrentParticipant: (participant) => {
          set({ currentParticipant });
          debugLog('Current participant set:', participant?.email);
        },
        
        setParticipantToken: (token) => {
          set({ participantToken: token });
          debugLog('Participant token set');
        },
        
        setRounds: (rounds) => {
          // Sort by round number
          const sorted = [...rounds].sort((a, b) => a.roundNumber - b.roundNumber);
          set({ rounds: sorted });
          debugLog('Participant rounds updated:', rounds.length);
        },
        
        updateRoundStatus: (roundId, status) => {
          set((state) => ({
            rounds: state.rounds.map((round) =>
              round.id === roundId ? { ...round, status } : round
            )
          }));
          debugLog('Round status updated:', roundId, status);
        },
        
        setContacts: (contacts) => {
          set({ contacts });
          debugLog('Contacts updated:', contacts.length);
        },
        
        addContact: (contact) => {
          set((state) => ({
            contacts: [...state.contacts, contact]
          }));
          debugLog('Contact added:', contact.firstName);
        },
        
        updateContact: (contactId, updates) => {
          set((state) => ({
            contacts: state.contacts.map((contact) =>
              contact.id === contactId ? { ...contact, ...updates } : contact
            )
          }));
          debugLog('Contact updated:', contactId);
        },
        
        removeContact: (contactId) => {
          set((state) => ({
            contacts: state.contacts.filter((contact) => contact.id !== contactId)
          }));
          debugLog('Contact removed:', contactId);
        },
        
        setActiveTab: (tab) => {
          set({ activeTab: tab });
        },
        
        // Loading
        setIsLoadingParticipant: (loading) => {
          set({ isLoadingParticipant: loading });
        },
        
        setIsLoadingRounds: (loading) => {
          set({ isLoadingRounds: loading });
        },
        
        setIsLoadingContacts: (loading) => {
          set({ isLoadingContacts: loading });
        },
        
        // Computed
        getUpcomingRounds: () => {
          const { rounds } = get();
          return rounds.filter((r) => r.status === 'upcoming');
        },
        
        getActiveRound: () => {
          const { rounds } = get();
          return rounds.find((r) => r.status === 'active') || null;
        },
        
        getCompletedRounds: () => {
          const { rounds } = get();
          return rounds.filter((r) => r.status === 'completed');
        },
        
        getNextRound: () => {
          const upcoming = get().getUpcomingRounds();
          return upcoming[0] || null;
        },
        
        // Reset
        reset: () => {
          set(initialState);
          debugLog('Participant store reset');
        }
      }),
      {
        name: 'oliwonder-participant-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          participantToken: state.participantToken,
          activeTab: state.activeTab
        })
      }
    ),
    { name: 'ParticipantStore' }
  )
);

/**
 * Selectors
 */
export const useCurrentParticipant = () => useParticipantStore((state) => state.currentParticipant);
export const useParticipantRounds = () => useParticipantStore((state) => state.rounds);
export const useParticipantContacts = () => useParticipantStore((state) => state.contacts);
export const useParticipantToken = () => useParticipantStore((state) => state.participantToken);
export const useActiveRound = () => useParticipantStore((state) => state.getActiveRound());
export const useNextRound = () => useParticipantStore((state) => state.getNextRound());
