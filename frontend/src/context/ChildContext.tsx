import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

interface ChildContextType {
  selectedChildId: string | null;
  setSelectedChildId: (id: string) => void;
  selectedChild: any | null;
  children: any[];
}

const ChildContext = createContext<ChildContextType | undefined>(undefined);

export const ChildProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [childrenList, setChildrenList] = useState<any[]>([]);

  useEffect(() => {
    // Assuming user profile has childrenIds populated from /auth/me or similar
    // For now we assume the children are in user.profile.childrenIds
    const profile = (user as any)?.profile;
    if (profile?.childrenIds && Array.isArray(profile.childrenIds)) {
      setChildrenList(profile.childrenIds);
      if (profile.childrenIds.length > 0 && !selectedChildId) {
        // Initialize with the first child if none selected
        setSelectedChildId(profile.childrenIds[0]._id || profile.childrenIds[0]);
      }
    }
  }, [user]);

  const selectedChild = childrenList.find(c => (c._id || c) === selectedChildId) || null;

  return (
    <ChildContext.Provider value={{ 
      selectedChildId, 
      setSelectedChildId, 
      selectedChild, 
      children: childrenList 
    }}>
      {children}
    </ChildContext.Provider>
  );
};

export const useChildContext = () => {
  const context = useContext(ChildContext);
  if (context === undefined) {
    throw new Error('useChildContext must be used within a ChildProvider');
  }
  return context;
};
