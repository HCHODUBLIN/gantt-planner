import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { loadFromLocalStorage, saveToLocalStorage, autoSaveToServer, clearLocalStorage } from '../utils/storage';
import { decrypt, encrypt, isUnlocked, setUnlocked, getSessionPin, setSessionPin, clearSession } from '../utils/crypto';
import demoTasks from '../data/demo-tasks.json';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [allData, setAllData] = useState(null);
  const [currentFilter, setCurrentFilter] = useState(new Set(['all']));
  const [saveStatus, setSaveStatus] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false); // true = unlocked with PIN
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinError, setPinError] = useState(null);
  const dataRef = useRef(null);

  // Load data
  useEffect(() => {
    async function load() {
      // Check if returning from a session with PIN
      if (isUnlocked() && getSessionPin()) {
        try {
          const resp = await fetch(import.meta.env.BASE_URL + 'tasks.encrypted.json');
          if (resp.ok) {
            const encData = await resp.text();
            const data = await decrypt(encData, getSessionPin());
            setAllData(data);
            dataRef.current = data;
            setIsPrivate(true);
            return;
          }
        } catch {
          // Decryption failed, fall through to demo
          clearSession();
        }
      }

      // Check localStorage first
      const saved = loadFromLocalStorage();
      if (saved) {
        setAllData(saved);
        dataRef.current = saved;
        // If localStorage has data and session is unlocked, it's private
        if (isUnlocked()) setIsPrivate(true);
        return;
      }

      // Default: load demo data
      setAllData(demoTasks);
      dataRef.current = demoTasks;
    }
    load();
  }, []);

  // Unlock with PIN
  const unlockWithPin = useCallback(async (pin) => {
    try {
      const resp = await fetch(import.meta.env.BASE_URL + 'tasks.encrypted.json');
      if (!resp.ok) {
        setPinError('No encrypted data found. Save your data first with a PIN.');
        return false;
      }
      const encData = await resp.text();
      const data = await decrypt(encData, pin);
      setAllData(data);
      dataRef.current = data;
      saveToLocalStorage(data);
      setSessionPin(pin);
      setUnlocked(true);
      setIsPrivate(true);
      setShowPinModal(false);
      setPinError(null);
      return true;
    } catch {
      setPinError('Wrong PIN or corrupted data');
      return false;
    }
  }, []);

  // Lock (go back to demo)
  const lock = useCallback(() => {
    clearSession();
    clearLocalStorage();
    setIsPrivate(false);
    setAllData(demoTasks);
    dataRef.current = demoTasks;
  }, []);

  // Export encrypted data (for committing to git)
  const exportEncrypted = useCallback(async (pin) => {
    if (!dataRef.current) return;
    const encrypted = await encrypt(dataRef.current, pin);
    const blob = new Blob([encrypted], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.encrypted.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Persist + auto-save
  const persistData = useCallback((newData) => {
    setAllData(newData);
    dataRef.current = newData;
    saveToLocalStorage(newData);
    autoSaveToServer(newData, () => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 800);
    });
  }, []);

  // Update a shallow copy of allData and persist
  const updateData = useCallback((updater) => {
    setAllData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      dataRef.current = next;
      saveToLocalStorage(next);
      autoSaveToServer(next, () => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 800);
      });
      return next;
    });
  }, []);

  // Filter logic
  const toggleFilter = useCallback((tag) => {
    setCurrentFilter(prev => {
      const next = new Set(prev);
      if (tag === 'all') {
        return new Set(['all']);
      }
      next.delete('all');
      if (next.has(tag)) {
        next.delete(tag);
        if (next.size === 0) next.add('all');
      } else {
        next.add(tag);
      }
      return next;
    });
  }, []);

  // Helper: find task by id
  const findTask = useCallback((taskId) => {
    if (!dataRef.current) return null;
    for (const cat of dataRef.current.categories) {
      const task = (cat.tasks || []).find(t => t.id === taskId);
      if (task) return task;
    }
    return null;
  }, []);

  // Check if category is Action Items
  const isActionItems = useCallback((catIdx) => {
    if (!dataRef.current) return false;
    const cat = dataRef.current.categories[catIdx];
    return cat && cat.name && cat.name.includes('Action Items');
  }, []);

  // Get all tags
  const getAllTags = useCallback(() => {
    if (!dataRef.current) return [];
    const tags = new Set();
    (dataRef.current.categories || []).forEach(cat => {
      (cat.tags || []).forEach(tag => {
        if (!tag.startsWith('divider')) tags.add(tag);
      });
    });
    return [...tags];
  }, []);

  // Reset data
  const resetData = useCallback(() => {
    clearLocalStorage();
    window.location.reload();
  }, []);

  return (
    <DataContext.Provider value={{
      allData,
      setAllData,
      persistData,
      updateData,
      currentFilter,
      setCurrentFilter,
      toggleFilter,
      findTask,
      isActionItems,
      getAllTags,
      saveStatus,
      setSaveStatus,
      resetData,
      // Auth
      isPrivate,
      showPinModal,
      setShowPinModal,
      pinError,
      setPinError,
      unlockWithPin,
      lock,
      exportEncrypted,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
