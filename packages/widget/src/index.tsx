import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { h, render } from 'preact';
import { fetchWidgetConfig } from './api';
import { ChatWidget } from './components/ChatWidget';
import { getWidgetStyles } from './styles';
import type { ScheduluxWidgetInstance, WidgetConfig, WidgetInitOptions } from './types';

export { ChatWidget } from './components/ChatWidget';
export { getWidgetStyles } from './styles';
export * from './types';

const activeInstances = new Map<string, ScheduluxWidgetInstance>();

/**
 * Initializes a Schedulux booking chat widget encapsulated completely inside Shadow DOM.
 */
export function initScheduluxWidget(options: WidgetInitOptions): ScheduluxWidgetInstance {
  const instanceKey = `${options.tenantId}_${options.agentId}`;
  if (activeInstances.has(instanceKey)) {
    const existing = activeInstances.get(instanceKey);
    if (existing) return existing;
  }

  // 1. Resolve host container
  const isCustomContainer = Boolean(options.container);
  const host = options.container || document.createElement('div');
  if (!isCustomContainer) {
    host.id = `schedulux-widget-${options.tenantId}-${options.agentId}`;
    document.body.appendChild(host);
  }

  // 2. Attach open Shadow DOM
  const shadowRoot = host.attachShadow({ mode: 'open' });

  // 3. Inject encapsulated styles
  const styleEl = document.createElement('style');
  let currentConfig: Partial<WidgetConfig> = { ...options.config };
  styleEl.textContent = getWidgetStyles(currentConfig, options.inline);
  shadowRoot.appendChild(styleEl);

  // 4. Create Preact mount point
  const mountPoint = document.createElement('div');
  mountPoint.className = 'schedulux-mount-root';
  shadowRoot.appendChild(mountPoint);

  // 5. Setup QueryClient and mount Preact widget
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
      },
    },
  });

  const renderApp = (cfg: Partial<WidgetConfig>) => {
    render(
      h(
        QueryClientProvider as any,
        { client: queryClient },
        h(ChatWidget, { options, config: cfg }),
      ),
      mountPoint,
    );
  };

  renderApp(currentConfig);

  const instance: ScheduluxWidgetInstance = {
    open: () => {
      const windowEl = shadowRoot.querySelector('.schedulux-window');
      windowEl?.classList.add('is-open');
    },
    close: () => {
      const windowEl = shadowRoot.querySelector('.schedulux-window');
      windowEl?.classList.remove('is-open');
    },
    toggle: () => {
      const windowEl = shadowRoot.querySelector('.schedulux-window');
      windowEl?.classList.toggle('is-open');
    },
    isOpen: () => {
      const windowEl = shadowRoot.querySelector('.schedulux-window');
      return Boolean(windowEl?.classList.contains('is-open'));
    },
    sendMessage: async (text: string) => {
      const inputEl = shadowRoot.querySelector<HTMLTextAreaElement>('.schedulux-textarea');
      const sendBtn = shadowRoot.querySelector<HTMLButtonElement>('.schedulux-send-btn');
      if (inputEl && sendBtn) {
        inputEl.value = text;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        sendBtn.click();
      }
    },
    resetConversation: () => {
      const resetBtn = shadowRoot.querySelector<HTMLButtonElement>(
        'button[aria-label="Reset conversation"]',
      );
      resetBtn?.click();
    },
    updateConfig: (newConfig: Partial<WidgetConfig>) => {
      currentConfig = {
        ...currentConfig,
        ...newConfig,
        theme: {
          ...(currentConfig.theme || {}),
          ...(newConfig.theme || {}),
        },
      };
      styleEl.textContent = getWidgetStyles(currentConfig, options.inline);
      renderApp(currentConfig);
    },
    destroy: () => {
      queryClient.clear();
      render(null, mountPoint);
      if (!isCustomContainer) {
        host.remove();
      } else {
        shadowRoot.innerHTML = '';
      }
      activeInstances.delete(instanceKey);
    },
  };

  activeInstances.set(instanceKey, instance);

  // Asynchronously fetch remote config to apply published theme from database
  fetchWidgetConfig(
    options.apiBase || '',
    options.tenantId,
    options.agentId,
    options.mode || 'live',
  )
    .then((remoteCfg) => {
      if (remoteCfg && Object.keys(remoteCfg).length > 0) {
        const mergedTheme = {
          ...(remoteCfg.theme || {}),
          ...(options.config?.theme || {}),
        };
        const mergedConfig: Partial<WidgetConfig> = {
          ...remoteCfg,
          ...options.config,
          theme: mergedTheme,
        };
        instance.updateConfig(mergedConfig);
      }
    })
    .catch((err) => {
      console.warn('[Schedulux Widget] Remote config fetch fallback:', err);
    });

  return instance;
}

export function destroyScheduluxWidget(tenantId: string, agentId: string): void {
  const instanceKey = `${tenantId}_${agentId}`;
  const instance = activeInstances.get(instanceKey);
  if (instance) {
    instance.destroy();
  }
}

// Browser Global Window Attachment
interface ScheduluxGlobalApi {
  init: typeof initScheduluxWidget;
  destroy: typeof destroyScheduluxWidget;
  instances: Map<string, ScheduluxWidgetInstance>;
}

declare global {
  interface Window {
    ScheduluxWidget?: ScheduluxGlobalApi;
  }
}

if (typeof window !== 'undefined') {
  window.ScheduluxWidget = {
    init: initScheduluxWidget,
    destroy: destroyScheduluxWidget,
    instances: activeInstances,
  };

  // Auto-initialize when embedded via `<script ... data-tenant-id="..." data-agent-id="...">`
  const currentScript =
    document.currentScript || document.querySelector('script[data-tenant-id][data-agent-id]');

  if (currentScript) {
    const tenantId = currentScript.getAttribute('data-tenant-id');
    const agentId = currentScript.getAttribute('data-agent-id');
    const apiBase = currentScript.getAttribute('data-api-base') || '';

    if (tenantId && agentId) {
      const primaryColor = currentScript.getAttribute('data-primary-color');
      const agentName = currentScript.getAttribute('data-agent-name');
      const greeting = currentScript.getAttribute('data-greeting');
      const position = currentScript.getAttribute('data-position') as WidgetConfig['position'];
      const themeMode = currentScript.getAttribute(
        'data-theme-mode',
      ) as WidgetConfig['theme'] extends { theme_mode?: infer M } ? M : never;

      initScheduluxWidget({
        tenantId,
        agentId,
        apiBase,
        config: {
          agent_name: agentName || undefined,
          initial_greeting: greeting || undefined,
          position: position || undefined,
          theme: {
            primary_color: primaryColor || undefined,
            theme_mode: themeMode || undefined,
          },
        },
      });
    }
  }
}
