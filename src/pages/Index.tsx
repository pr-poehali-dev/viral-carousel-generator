import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  generateCarousel,
  generateCarouselAI,
  STYLES,
  PLATFORMS,
  EXAMPLES,
  type Style,
  type Platform,
  type Carousel,
} from '@/lib/carousel';

type Tab = 'generator' | 'examples' | 'history' | 'settings';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'generator', label: 'Генератор', icon: 'Sparkles' },
  { key: 'examples', label: 'Примеры', icon: 'LayoutGrid' },
  { key: 'history', label: 'История', icon: 'History' },
  { key: 'settings', label: 'Настройки', icon: 'Settings2' },
];

const styleLabel = (s: Style) => STYLES.find((x) => x.key === s)!;

const copy = (text: string, label = 'Скопировано') => {
  navigator.clipboard.writeText(text);
  toast({ title: label, description: 'Текст в буфере обмена' });
};

const Index = () => {
  const [tab, setTab] = useState<Tab>('generator');
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState<Style>('viral');
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [slideCount, setSlideCount] = useState(7);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Carousel | null>(null);
  const [history, setHistory] = useState<Carousel[]>([]);

  const run = async (t: string, s: Style, p: Platform = platform) => {
    if (!t.trim()) {
      toast({ title: 'Введите тему', description: 'Например: нейросети, маркетинг, продажи' });
      return;
    }
    setLoading(true);
    setTab('generator');
    try {
      const c = await generateCarouselAI(t, s, p, slideCount);
      setResult(c);
      setHistory((h) => [c, ...h].slice(0, 30));
    } catch (e) {
      const c = generateCarousel(t, s, slideCount, p);
      setResult(c);
      setHistory((h) => [c, ...h].slice(0, 30));
      toast({
        title: 'AI временно недоступен',
        description: e instanceof Error ? e.message : 'Показана базовая версия карусели',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbff] text-slate-900 font-sans relative overflow-hidden">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-violet-300/40 blur-3xl animate-float" />
      <div className="pointer-events-none absolute top-20 -right-40 h-96 w-96 rounded-full bg-pink-300/40 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-orange-200/40 blur-3xl animate-float" style={{ animationDelay: '4s' }} />

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/40">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl gradient-brand animate-gradient-shift text-white shadow-lg shadow-violet-500/30">
              <Icon name="Layers" size={20} />
            </div>
            <div>
              <p className="font-display text-lg font-extrabold leading-none">Carousel AI</p>
              <p className="text-xs text-slate-500">вирусные карусели за секунды</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1 rounded-2xl bg-white/60 p-1 shadow-sm">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  tab === t.key ? 'gradient-brand animate-gradient-shift text-white shadow-md' : 'text-slate-600 hover:bg-white'
                }`}
              >
                <Icon name={t.icon} size={16} />
                {t.label}
              </button>
            ))}
          </nav>
        </div>
        {/* mobile tabs */}
        <nav className="md:hidden flex gap-1 overflow-x-auto px-4 pb-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold ${
                tab === t.key ? 'gradient-brand text-white' : 'bg-white/70 text-slate-600'
              }`}
            >
              <Icon name={t.icon} size={14} />
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="container relative z-10 py-10">
        {tab === 'generator' && (
          <GeneratorTab
            topic={topic}
            setTopic={setTopic}
            style={style}
            setStyle={setStyle}
            platform={platform}
            setPlatform={setPlatform}
            loading={loading}
            result={result}
            onRun={() => run(topic, style)}
          />
        )}
        {tab === 'examples' && <ExamplesTab onUse={(t, s) => { setTopic(t); setStyle(s); run(t, s); }} />}
        {tab === 'history' && (
          <HistoryTab
            history={history}
            onOpen={(c) => { setResult(c); setTab('generator'); }}
            onClear={() => setHistory([])}
          />
        )}
        {tab === 'settings' && (
          <SettingsTab style={style} setStyle={setStyle} slideCount={slideCount} setSlideCount={setSlideCount} />
        )}
      </main>

      <footer className="container relative z-10 py-8 text-center text-sm text-slate-400">
        Carousel AI · сделано с любовью для контент-мейкеров ✨
      </footer>
    </div>
  );
};

/* ---------- Generator ---------- */
function GeneratorTab(props: {
  topic: string;
  setTopic: (v: string) => void;
  style: Style;
  setStyle: (v: Style) => void;
  platform: Platform;
  setPlatform: (v: Platform) => void;
  loading: boolean;
  result: Carousel | null;
  onRun: () => void;
}) {
  const { topic, setTopic, style, setStyle, platform, setPlatform, loading, result, onRun } = props;

  return (
    <div className="space-y-10">
      {/* Hero / input */}
      <section className="text-center max-w-3xl mx-auto animate-fade-in">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-xs font-semibold text-violet-700 shadow-sm">
          <Icon name="Zap" size={14} /> Генерация за секунды
        </span>
        <h1 className="mt-5 font-display text-4xl md:text-6xl font-extrabold leading-tight">
          Вирусные карусели <span className="gradient-text">с искусственным интеллектом</span>
        </h1>
        <p className="mt-4 text-base md:text-lg text-slate-500">
          Введи только тему — AI напишет уникальный заголовок, тексты слайдов, идеи визуала, призыв, кодовое слово и промпты для нейросетей.
        </p>

        <div className="mt-8 glass rounded-3xl p-2 shadow-xl shadow-violet-500/10 ring-1 ring-white/60">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Icon name="Search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onRun()}
                placeholder="Тема: нейросети, заработок, маркетинг, бьюти…"
                className="w-full rounded-2xl bg-white/80 py-4 pl-11 pr-4 text-base outline-none ring-1 ring-transparent focus:ring-violet-300"
              />
            </div>
            <Button
              onClick={onRun}
              disabled={loading}
              className="h-auto rounded-2xl gradient-brand animate-gradient-shift px-7 py-4 text-base font-bold shadow-lg shadow-violet-500/30 hover:opacity-95"
            >
              {loading ? (
                <Icon name="Loader2" size={18} className="animate-spin" />
              ) : (
                <Icon name="Sparkles" size={18} />
              )}
              {loading ? 'AI создаёт…' : 'Сгенерировать'}
            </Button>
          </div>
        </div>

        {/* style chips */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {STYLES.map((s) => (
            <button
              key={s.key}
              onClick={() => setStyle(s.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                style === s.key
                  ? 'gradient-brand text-white shadow-md scale-105'
                  : 'bg-white/70 text-slate-600 hover:bg-white'
              }`}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>

        {/* platform selector */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Площадка:</span>
          <div className="inline-flex gap-1 rounded-2xl bg-white/70 p-1 shadow-sm">
            {PLATFORMS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPlatform(p.key)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-all ${
                  platform === p.key ? 'gradient-brand text-white shadow' : 'text-slate-600 hover:bg-white'
                }`}
              >
                <Icon name={p.icon} size={14} fallback="Share2" />
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Result */}
      {loading && !result ? (
        <LoadingState />
      ) : result ? (
        <ResultView result={result} onRegenerate={onRun} loading={loading} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mx-auto max-w-md text-center py-12 animate-fade-in">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl gradient-brand animate-gradient-shift">
        <Icon name="Loader2" size={32} className="text-white animate-spin" />
      </div>
      <p className="mt-4 font-display text-lg font-bold">AI создаёт твою карусель…</p>
      <p className="mt-1 text-sm text-slate-500">Заголовок, тексты, визуалы и промпты — пара секунд</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-md text-center py-12 animate-fade-in">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl gradient-soft">
        <Icon name="Wand2" size={32} className="text-violet-500" />
      </div>
      <p className="mt-4 font-display text-lg font-bold">Здесь появится твоя карусель</p>
      <p className="mt-1 text-sm text-slate-500">Введи тему и нажми «Сгенерировать»</p>
    </div>
  );
}

function ResultView({ result, onRegenerate, loading }: { result: Carousel; onRegenerate: () => void; loading: boolean }) {
  const sl = styleLabel(result.style);
  const pl = PLATFORMS.find((p) => p.key === result.platform);
  const fullText =
    `Тема: ${result.topic}\nСтиль: ${sl.label}\nПлощадка: ${pl?.label ?? ''}\n\n` +
    result.slides.map((s) => `Слайд ${s.index + 1} — ${s.role}\n${s.text}\nВизуал: ${s.visualIdea}\nПромпт: ${s.prompt}`).join('\n\n') +
    `\n\nCTA: ${result.cta}\nКодовое слово: ${result.codeWord}`;

  return (
    <section className="space-y-6 animate-scale-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold">Карусель готова 🎉</h2>
          <p className="text-sm text-slate-500">
            Тема «{result.topic}» · стиль {sl.emoji} {sl.label}
            {pl && <> · <Icon name={pl.icon} size={13} fallback="Share2" className="inline -mt-0.5" /> {pl.label}</>}
            {' '}· {result.slides.length} слайдов
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => copy(fullText, 'Вся карусель скопирована')}>
            <Icon name="Copy" size={16} /> Копировать всё
          </Button>
          <Button
            onClick={onRegenerate}
            disabled={loading}
            className="rounded-xl gradient-brand animate-gradient-shift font-bold shadow-md"
          >
            <Icon name={loading ? 'Loader2' : 'RefreshCw'} size={16} className={loading ? 'animate-spin' : ''} />
            Сгенерировать заново
          </Button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {result.slides.map((s) => (
          <SlideCard key={s.index} slide={s} total={result.slides.length} />
        ))}
      </div>

      {/* CTA + code word */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl gradient-brand animate-gradient-shift p-6 text-white shadow-xl shadow-violet-500/20">
          <div className="flex items-center gap-2 text-sm font-semibold opacity-90">
            <Icon name="Megaphone" size={16} /> Призыв к действию
          </div>
          <p className="mt-3 text-lg font-display font-bold leading-snug">{result.cta}</p>
          <button
            onClick={() => copy(result.cta, 'CTA скопирован')}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm font-semibold hover:bg-white/30"
          >
            <Icon name="Copy" size={14} /> Скопировать
          </button>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-violet-100">
          <div className="flex items-center gap-2 text-sm font-semibold text-violet-600">
            <Icon name="KeyRound" size={16} /> Кодовое слово для комментариев
          </div>
          <p className="mt-3 font-display text-3xl font-extrabold gradient-text tracking-wide">{result.codeWord}</p>
          <button
            onClick={() => copy(result.codeWord, 'Кодовое слово скопировано')}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100"
          >
            <Icon name="Copy" size={14} /> Скопировать
          </button>
        </div>
      </div>
    </section>
  );
}

function SlideCard({ slide, total }: { slide: ReturnType<typeof generateCarousel>['slides'][number]; total: number }) {
  return (
    <div className="hover-lift rounded-3xl bg-white p-5 shadow-md ring-1 ring-slate-100">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-full gradient-soft px-3 py-1 text-xs font-bold text-violet-700">
          Слайд {slide.index + 1}/{total}
        </span>
        <span className="text-xs font-semibold text-slate-400">{slide.role}</span>
      </div>

      <p className="mt-3 font-display text-base font-bold leading-snug text-slate-800">{slide.text}</p>

      <div className="mt-4 rounded-2xl bg-slate-50 p-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Icon name="Image" size={13} /> Идея визуала
        </div>
        <p className="mt-1 text-sm text-slate-600">{slide.visualIdea}</p>
      </div>

      <div className="mt-3 rounded-2xl bg-gradient-to-br from-violet-50 to-pink-50 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-600">
            <Icon name="Banana" size={13} fallback="Sparkles" /> Промпт для нейросети
          </div>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">{slide.prompt}</p>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => copy(slide.text, 'Текст слайда скопирован')}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700"
        >
          <Icon name="Copy" size={14} /> Текст
        </button>
        <button
          onClick={() => copy(slide.prompt, 'Промпт скопирован')}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-pink-100 px-3 py-2 text-sm font-semibold text-pink-700 hover:bg-pink-200"
        >
          <Icon name="Wand2" size={14} /> Промпт
        </button>
      </div>
    </div>
  );
}

/* ---------- Examples ---------- */
function ExamplesTab({ onUse }: { onUse: (topic: string, style: Style) => void }) {
  return (
    <div className="animate-fade-in">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="font-display text-3xl font-extrabold">Готовые вирусные карусели</h2>
        <p className="mt-2 text-slate-500">Выбери нишу — и сразу сгенерируй свою карусель в этом стиле</p>
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {EXAMPLES.map((ex) => {
          const sl = styleLabel(ex.style);
          return (
            <div key={ex.niche} className="hover-lift rounded-3xl bg-white p-6 shadow-md ring-1 ring-slate-100">
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl gradient-soft text-2xl">{ex.emoji}</div>
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">{sl.emoji} {sl.label}</span>
              </div>
              <p className="mt-4 font-display text-lg font-bold">{ex.niche}</p>
              <p className="mt-1 text-sm text-slate-500 leading-snug">«{ex.hook}»</p>
              <Button onClick={() => onUse(ex.topic, ex.style)} className="mt-5 w-full rounded-xl gradient-brand font-bold">
                <Icon name="Sparkles" size={16} /> Сделать такую
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- History ---------- */
function HistoryTab({ history, onOpen, onClear }: { history: Carousel[]; onOpen: (c: Carousel) => void; onClear: () => void }) {
  if (!history.length) {
    return (
      <div className="mx-auto max-w-md text-center py-16 animate-fade-in">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl gradient-soft">
          <Icon name="History" size={32} className="text-violet-500" />
        </div>
        <p className="mt-4 font-display text-lg font-bold">История пуста</p>
        <p className="mt-1 text-sm text-slate-500">Созданные карусели будут сохраняться здесь</p>
      </div>
    );
  }
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl font-extrabold">История</h2>
        <Button variant="outline" className="rounded-xl" onClick={onClear}>
          <Icon name="Trash2" size={16} /> Очистить
        </Button>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {history.map((c) => {
          const sl = styleLabel(c.style);
          return (
            <button
              key={c.id}
              onClick={() => onOpen(c)}
              className="hover-lift text-left rounded-3xl bg-white p-5 shadow-md ring-1 ring-slate-100"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">{sl.emoji} {sl.label}</span>
                <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString('ru')}</span>
              </div>
              <p className="mt-3 font-display text-base font-bold leading-snug">{c.hook}</p>
              <p className="mt-1 text-sm text-slate-500">Тема: {c.topic} · {c.slides.length} слайдов</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Settings ---------- */
function SettingsTab(props: {
  style: Style;
  setStyle: (v: Style) => void;
  slideCount: number;
  setSlideCount: (v: number) => void;
}) {
  const { style, setStyle, slideCount, setSlideCount } = props;
  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-8">
      <div className="text-center">
        <h2 className="font-display text-3xl font-extrabold">Настройки генерации</h2>
        <p className="mt-2 text-slate-500">Подбери параметры под свою задачу</p>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-slate-100">
        <p className="font-display font-bold">Стиль текста по умолчанию</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {STYLES.map((s) => (
            <button
              key={s.key}
              onClick={() => setStyle(s.key)}
              className={`flex items-center gap-3 rounded-2xl p-4 text-left transition-all ${
                style === s.key ? 'gradient-soft ring-2 ring-violet-400' : 'bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <span className="text-2xl">{s.emoji}</span>
              <span>
                <span className="block font-bold">{s.label}</span>
                <span className="block text-sm text-slate-500">{s.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-slate-100">
        <div className="flex items-center justify-between">
          <p className="font-display font-bold">Количество слайдов</p>
          <span className="rounded-full gradient-brand px-4 py-1 font-bold text-white">{slideCount}</span>
        </div>
        <input
          type="range"
          min={3}
          max={10}
          value={slideCount}
          onChange={(e) => setSlideCount(Number(e.target.value))}
          className="mt-5 w-full accent-violet-600"
        />
        <div className="mt-2 flex justify-between text-xs text-slate-400">
          <span>3 слайда</span>
          <span>10 слайдов</span>
        </div>
      </div>
    </div>
  );
}

export default Index;