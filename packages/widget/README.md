# @repo/widget - Schedulux Customer Booking Widget

A lightweight (~13KB gzipped), production-grade customer booking chat widget powered by **Preact** and encapsulated in an **open Shadow DOM**.

---

## Key Highlights

- **Complete Shadow DOM Encapsulation**: Host styles from external websites cannot leak into the chat widget, and the widget's CSS cannot leak into the host website.
- **Ultra-Lightweight & Fast**: Built on Preact (~3KB runtime) with zero heavy external icon/UI dependencies (inlined SVG icons).
- **Embedded Theme Customization**: Customizes primary/secondary colors, header styling, user & agent bubble colors, border radius, typography, and theme mode directly through `widget_config.theme`.
- **Audio & Visual Delight**: Built-in synthesized web audio chimes on message arrival (zero MP3 network requests) and animated bouncing dots typing indicator.
- **Session & Paging Support**: Caches public session IDs and tokens in `sessionStorage` with graceful conversation reset.
- **Mobile Responsive**: Adapts seamlessly to mobile screens (< 480px) with full-screen presentation.

---

## Integration Methods

### Option 1: Script Tag Embed (HTML)

Drop this one-liner anywhere before the closing `</body>` tag on any CMS or static site:

```html
<script
  src="https://cdn.schedulux.ai/widget.js"
  data-tenant-id="your_tenant_id"
  data-agent-id="your_agent_id"
  data-api-base="https://api.schedulux.ai"
  data-primary-color="#4F46E5"
  data-agent-name="AI Booking Receptionist"
  data-position="bottom-right"
  async>
</script>
```

### Option 2: Programmatic JavaScript API

```javascript
import { initScheduluxWidget } from '@repo/widget';

const widget = initScheduluxWidget({
  tenantId: 'tenant_123',
  agentId: 'agent_456',
  apiBase: 'https://api.schedulux.ai',
  config: {
    agent_name: 'Apex AI',
    position: 'bottom-right',
    theme: {
      primary_color: '#0F0F11',
      user_bubble_bg: '#0F0F11',
      border_radius: '16px',
    },
  },
  onBookingConfirmed: (details) => {
    console.log('Booking confirmed:', details);
  },
});

// Imperative controls:
widget.open();
widget.close();
widget.toggle();
widget.sendMessage("Do you have openings tomorrow at 2 PM?");
widget.updateConfig({ agent_name: "Updated Assistant" });
widget.destroy();
```

---

## Build Output

- `dist/widget.js`: Standalone browser IIFE bundle containing Preact runtime + widget app for direct CDN serving.
- `dist/index.js` & `dist/index.d.ts`: ES module exports for workspace applications (e.g. Schedulux Studio test sandbox).

