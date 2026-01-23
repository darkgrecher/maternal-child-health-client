/**
 * Emergency Contact Store
 * 
 * Zustand store for managing emergency contacts.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  emergencyContactService,
  EmergencyContact,
  CreateEmergencyContactRequest,
  UpdateEmergencyContactRequest,
} from '../services/emergencyContactService';

interface EmergencyContactState {
  // Data
  contacts: EmergencyContact[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // API Actions
  fetchContacts: () => Promise<void>;
  createContact: (data: CreateEmergencyContactRequest) => Promise<EmergencyContact>;
  updateContact: (id: string, data: UpdateEmergencyContactRequest) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  setPrimaryContact: (id: string) => Promise<void>;
  
  // Utility
  clearData: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed values
  getPrimaryContact: () => EmergencyContact | undefined;
  getUserContacts: () => EmergencyContact[];
  getDefaultContacts: () => EmergencyContact[];
}

export const useEmergencyContactStore = create<EmergencyContactState>()(
  persist(
    (set, get) => ({
      // Initial state
      contacts: [],
      isLoading: false,
      error: null,

      // Fetch all contacts
      fetchContacts: async () => {
        set({ isLoading: true, error: null });
        try {
          const contacts = await emergencyContactService.getContacts();
          set({ contacts, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || error.message || 'Failed to fetch contacts',
            isLoading: false 
          });
        }
      },

      // Create a new contact
      createContact: async (data: CreateEmergencyContactRequest) => {
        set({ isLoading: true, error: null });
        try {
          const newContact = await emergencyContactService.createContact(data);
          set(state => ({ 
            contacts: [...state.contacts, newContact],
            isLoading: false 
          }));
          return newContact;
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || error.message || 'Failed to create contact',
            isLoading: false 
          });
          throw error;
        }
      },

      // Update a contact
      updateContact: async (id: string, data: UpdateEmergencyContactRequest) => {
        set({ isLoading: true, error: null });
        try {
          const updatedContact = await emergencyContactService.updateContact(id, data);
          set(state => ({
            contacts: state.contacts.map(c => 
              c.id === id ? updatedContact : c
            ),
            isLoading: false
          }));
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || error.message || 'Failed to update contact',
            isLoading: false 
          });
          throw error;
        }
      },

      // Delete a contact
      deleteContact: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await emergencyContactService.deleteContact(id);
          set(state => ({
            contacts: state.contacts.filter(c => c.id !== id),
            isLoading: false
          }));
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || error.message || 'Failed to delete contact',
            isLoading: false 
          });
          throw error;
        }
      },

      // Set a contact as primary
      setPrimaryContact: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await emergencyContactService.setPrimaryContact(id);
          set(state => ({
            contacts: state.contacts.map(c => ({
              ...c,
              isPrimary: c.id === id,
            })),
            isLoading: false
          }));
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || error.message || 'Failed to set primary contact',
            isLoading: false 
          });
          throw error;
        }
      },

      // Clear all data
      clearData: () => {
        set({ contacts: [], error: null });
      },

      // Set loading state
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Set error
      setError: (error: string | null) => {
        set({ error });
      },

      // Get primary contact
      getPrimaryContact: () => {
        const { contacts } = get();
        return contacts.find(c => c.isPrimary);
      },

      // Get user-added contacts (non-default)
      getUserContacts: () => {
        const { contacts } = get();
        return contacts.filter(c => !c.isDefault);
      },

      // Get default contacts
      getDefaultContacts: () => {
        const { contacts } = get();
        return contacts.filter(c => c.isDefault);
      },
    }),
    {
      name: 'emergency-contacts-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ contacts: state.contacts }),
    }
  )
);
