import { EventButton } from './EventButton.jsx';

export function EventGrid({ definitions, onQuickLog, onCustomize }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {definitions.map(def => (
        <EventButton key={def.id} definition={def} onQuickLog={onQuickLog} onCustomize={onCustomize} />
      ))}
    </div>
  );
}
