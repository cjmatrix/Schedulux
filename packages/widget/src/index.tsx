import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { h, render } from 'preact';
import { fetchWidgetConfig } from './api';
import { ChatWidget } from './components/ChatWidget';
import { getWidgetStyles } from './styles';
import type { ScheduluxWidgetInstance, WidgetConfig, WidgetInitOptions } from './types';

export { ChatWidget } from './components/ChatWidget';
export { renderMarkdown } from './markdown';
export { getWidgetStyles } from './styles';
export * from './theme';
export * from './types';

const activeInstances = new Map<string, ScheduluxWidgetInstance>();

function cleanUndefined<T extends Record<string, any>>(obj?: T): Partial<T> {
  if (!obj || typeof obj !== 'object') return {};
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        const sub = cleanUndefined(value);
        if (Object.keys(sub).length > 0) {
          cleaned[key] = sub;
        }
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned as Partial<T>;
}

export function initScheduluxWidget(options: WidgetInitOptions): ScheduluxWidgetInstance {
  const instanceKey = `${options.tenantId}_${options.agentId}`;
  if (activeInstances.has(instanceKey)) {
    const existing = activeInstances.get(instanceKey);
    if (existing) {
      if (options.container) {
        existing.destroy();
      } else {
        return existing;
      }
    }
  }

  
  const isCustomContainer = Boolean(options.container);
  const host = options.container || document.createElement('div');
  if (!isCustomContainer) {
    host.id = `schedulux-widget-${options.tenantId}-${options.agentId}`;
    document.body.appendChild(host);
  }

 
  const shadowRoot = host.shadowRoot || host.attachShadow({ mode: 'open' });
  shadowRoot.innerHTML = '';


  const styleEl = document.createElement('style');
  let currentConfig: Partial<WidgetConfig> = cleanUndefined(options.config);
  styleEl.textContent = getWidgetStyles(currentConfig, options.inline);
  shadowRoot.appendChild(styleEl);

 
  const mountPoint = document.createElement('div');
  mountPoint.className = 'schedulux-mount-root';
  shadowRoot.appendChild(mountPoint);

  
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
      const cleanNew = cleanUndefined(newConfig);
      currentConfig = {
        ...currentConfig,
        ...cleanNew,
        theme: {
          ...(currentConfig.theme || {}),
          ...(cleanNew.theme || {}),
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

  
  fetchWidgetConfig(
    options.apiBase || '',
    options.tenantId,
    options.agentId,
    options.mode || 'live',
  )
    .then((remoteCfg) => {
      if (remoteCfg && Object.keys(remoteCfg).length > 0) {
        const localOverrides = cleanUndefined(options.config);
        const mergedConfig: Partial<WidgetConfig> = {
          ...remoteCfg,
          ...localOverrides,
          theme: {
            ...(remoteCfg.theme || {}),
            ...(localOverrides.theme || {}),
          },
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
      const containerSelector = currentScript.getAttribute('data-container');
      const inlineAttr = currentScript.getAttribute('data-inline');

      const scriptConfig: Partial<WidgetConfig> = {};
      if (agentName) scriptConfig.agent_name = agentName;
      if (greeting) scriptConfig.initial_greeting = greeting;
      if (position) scriptConfig.position = position;
      if (primaryColor || themeMode) {
        scriptConfig.theme = {};
        if (primaryColor) scriptConfig.theme.primary_color = primaryColor;
        if (themeMode) scriptConfig.theme.theme_mode = themeMode;
      }

      const resolveAndInit = () => {
        const containerEl = containerSelector
          ? (document.querySelector(containerSelector) as HTMLElement | null)
          : null;
        const isInline = inlineAttr === 'true' || Boolean(containerEl);

        initScheduluxWidget({
          tenantId,
          agentId,
          apiBase,
          container: containerEl || undefined,
          inline: isInline,
          config: scriptConfig,
        });
      };

      if (
        containerSelector &&
        !document.querySelector(containerSelector) &&
        document.readyState === 'loading'
      ) {
        document.addEventListener('DOMContentLoaded', resolveAndInit);
      } else {
        resolveAndInit();
      }
    }
  }
}
