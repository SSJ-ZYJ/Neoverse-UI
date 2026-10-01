import { UiAction, UiButton, UiCard, UiIconButton, UiNotice, UiSurface } from '@neoverse-ui/react';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';

const locale = new URLSearchParams(window.location.search).get('lang') === 'zh' ? 'zh' : 'en';
document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';

const copy =
  locale === 'zh'
    ? {
        eyebrow: 'React Adapter Fixture',
        title: 'React 运行态校验',
        description: '直接渲染公开 React Adapter，校验 DOM 语义、交互与共享视觉契约。',
        action: '打开文档',
        button: '交互按钮',
        icon: '增加计数',
        notice: 'React Notice 与 Vue 共用相同的语义样式契约。',
        noticeAction: '确认',
        card: 'React Card',
        surface: 'React Surface',
        count: '计数',
      }
    : {
        eyebrow: 'React Adapter Fixture',
        title: 'React runtime validation',
        description:
          'Public React adapters are rendered directly to validate DOM semantics, interaction, and the shared visual contract.',
        action: 'Open documentation',
        button: 'Interactive button',
        icon: 'Increase count',
        notice: 'React Notice shares the same semantic styling contract as Vue.',
        noticeAction: 'Acknowledge',
        card: 'React Card',
        surface: 'React Surface',
        count: 'Count',
      };

function ReactFixture() {
  const [count, setCount] = useState(0);

  return (
    <main
      id="react-runtime-fixture"
      data-react-runtime-fixture
      className="mx-auto grid min-h-screen w-full max-w-container-xl gap-grid px-gutter-inline py-gutter-block"
    >
      <header className="grid max-w-container-lg gap-2">
        <p className="text-label font-label text-accent-primary">{copy.eyebrow}</p>
        <h1 className="text-heading font-heading tracking-heading text-primary">{copy.title}</h1>
        <p className="text-body text-secondary">{copy.description}</p>
      </header>

      <UiSurface
        surface="glass-subtle"
        className="grid gap-4 rounded-card p-4"
        data-react-adapter="UiSurface"
      >
        <div className="flex flex-wrap items-center gap-2">
          <UiAction
            href="#react-runtime-fixture"
            onClick={(event) => event.preventDefault()}
            variant="secondary"
            data-react-adapter="UiAction"
          >
            {copy.action}
          </UiAction>
          <UiButton
            variant="primary"
            onClick={() => setCount((value) => value + 1)}
            data-react-adapter="UiButton"
          >
            {copy.button} · {copy.count} {count}
          </UiButton>
          <UiIconButton
            label={copy.icon}
            variant="ghost"
            onClick={() => setCount((value) => value + 1)}
            data-react-adapter="UiIconButton"
          >
            +
          </UiIconButton>
        </div>

        <UiNotice
          variant="info"
          data-react-adapter="UiNotice"
          action={
            <UiButton size="sm" variant="ghost" surface="none">
              {copy.noticeAction}
            </UiButton>
          }
        >
          {copy.notice}
        </UiNotice>

        <UiCard as="article" surface="elevated" className="grid gap-2" data-react-adapter="UiCard">
          <h2 className="text-subtitle font-heading tracking-heading text-primary">{copy.card}</h2>
          <p className="text-body text-secondary">
            {copy.surface} · {copy.count} {count}
          </p>
        </UiCard>
      </UiSurface>
    </main>
  );
}

const root = document.getElementById('react-root');
if (root === null) {
  throw new Error('React fixture root is missing.');
}

createRoot(root).render(<ReactFixture />);
