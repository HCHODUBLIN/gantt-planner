import { useData } from '../contexts/DataContext';
import { useI18n } from '../contexts/I18nContext';

interface RoutineSectionProps {
  onEditRoutine: () => void;
}

export default function RoutineSection({ onEditRoutine }: RoutineSectionProps) {
  const { allData } = useData();
  const { t, lang } = useI18n();

  if (!allData) return null;

  const routine = allData.routine || { blocks: [], saturday: '', sunday: '', rules: '', exercise: '' };
  const blocks = routine.blocks || [];

  const extras = [
    { labelKo: '규칙', labelEn: 'Rules', value: routine.rules },
    { labelKo: '토요일', labelEn: 'Saturday', value: routine.saturday },
    { labelKo: '일요일', labelEn: 'Sunday', value: routine.sunday },
    { labelKo: '운동', labelEn: 'Exercise', value: routine.exercise },
  ];

  return (
    <div className="routine-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3>{t('routineTitle')}</h3>
        <button className="action-btn" onClick={onEditRoutine} style={{ fontSize: '11px', padding: '4px 10px' }}>
          {t('editRoutine')}
        </button>
      </div>
      <div>
        {blocks.map((b, i) => {
          const label = lang === 'en' ? (b.labelEn || b.label) : b.label;
          return (
            <div key={i} className="routine-item">
              <span className="routine-label">{b.emoji} {label} ({b.hours}):</span>{' '}
              <span className="routine-text">{b.desc}</span>
            </div>
          );
        })}
        {extras.map((e, i) => {
          if (!e.value) return null;
          const label = lang === 'en' ? e.labelEn : e.labelKo;
          return (
            <div key={`extra-${i}`} className="routine-item">
              <span className="routine-label">{label}:</span>{' '}
              <span className="routine-text">{e.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
