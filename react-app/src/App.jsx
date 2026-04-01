import { Routes, Route } from 'react-router-dom';
import GanttChart from './components/GanttChart';
import WeeklyPlanner from './components/WeeklyPlanner';
import PinModal from './components/PinModal';
import { useData } from './contexts/DataContext';
import { useI18n } from './contexts/I18nContext';
import { getGitHubToken, setGitHubToken, clearGitHubToken } from './utils/crypto';

export default function App() {
  const {
    isPrivate, showPinModal, setShowPinModal,
    pinError, setPinError, unlockWithPin, lock, exportEncrypted
  } = useData();
  const { t } = useI18n();

  const handleExportEncrypted = () => {
    const pin = prompt(t('exportEncPrompt'));
    if (pin && pin.length >= 4) {
      exportEncrypted(pin);
    }
  };

  const handleSetToken = () => {
    const existing = getGitHubToken();
    if (existing) {
      if (confirm('GitHub token is set. Remove it?')) {
        clearGitHubToken();
        alert('Token removed.');
      }
    } else {
      const token = prompt('Enter GitHub Personal Access Token (needs repo scope):');
      if (token && token.trim()) {
        setGitHubToken(token.trim());
        alert('Token saved! Save button will now auto-push to GitHub.');
      }
    }
  };

  return (
    <>
      {/* Lock/Unlock bar */}
      <div className="auth-bar">
        {isPrivate ? (
          <>
            <span className="auth-status private">{t('unlockLabel')}</span>
            <button className="auth-btn" onClick={handleSetToken} title="Configure GitHub auto-save">
              {getGitHubToken() ? '🔗 GitHub ✓' : '🔗 GitHub'}
            </button>
            <button className="auth-btn" onClick={handleExportEncrypted}>{t('exportEncBtn')}</button>
            <button className="auth-btn lock" onClick={lock}>{t('lockBtn')}</button>
          </>
        ) : (
          <>
            <span className="auth-status demo">{t('demoLabel')}</span>
            <button className="auth-btn unlock" onClick={() => { setPinError(null); setShowPinModal(true); }}>🔓 Unlock</button>
          </>
        )}
      </div>

      <Routes>
        <Route path="/" element={<GanttChart />} />
        <Route path="/weekly" element={<WeeklyPlanner />} />
      </Routes>

      {showPinModal && (
        <PinModal
          onSubmit={unlockWithPin}
          onCancel={() => setShowPinModal(false)}
          error={pinError}
        />
      )}
    </>
  );
}
