import { useState } from 'react';

const SLIDES = [
  { emoji: '📱', title: 'Ghi lại bất kỳ chuyện gì vừa xảy ra.' },
  { emoji: '💩 🚽 💧 ☕', title: 'Chuyện lớn, chuyện nhỏ, chuyện riêng tư — đều đáng ghi lại.' },
  { emoji: '📊', title: 'Sau một thời gian, bạn có thể nhìn thấy nhịp sống của chính mình.' },
];

export function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-[200] bg-surface flex flex-col items-center justify-between py-12 px-8 animate-fade-in">
      <button onClick={onDone} className="self-end text-xs text-muted hover:text-body">Bỏ qua</button>

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xs">
        <p className="text-6xl mb-6">{slide.emoji}</p>
        <p className="text-lg font-semibold text-primary leading-snug">{slide.title}</p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <div className="flex justify-center gap-1.5">
          {SLIDES.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-ink' : 'w-1.5 bg-surface-alt2'}`} />
          ))}
        </div>
        <button
          onClick={() => (isLast ? onDone() : setStep(s => s + 1))}
          className="w-full bg-ink text-on-ink font-medium py-3.5 rounded-2xl hover:bg-ink-hover transition-all active:scale-95"
        >
          {isLast ? 'Bắt đầu' : 'Tiếp tục'}
        </button>
      </div>
    </div>
  );
}
