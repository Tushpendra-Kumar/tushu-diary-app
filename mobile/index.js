import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import { enableScreens } from 'react-native-screens';

enableScreens(true);

// ── Global Root-Cause Fix: Suppress Browser/Native Focus Outline & Ring ───────
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const injectGlobalInputFocusReset = () => {
    const styleId = 'tushudiary-global-focus-reset';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* Globally remove default browser white/grey focus outline & ring across all inputs */
        input, textarea, select, [contenteditable="true"], [role="textbox"], [data-focusable="true"] {
          outline: none !important;
          outline-style: none !important;
          outline-width: 0 !important;
          outline-color: transparent !important;
          box-shadow: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }
        input:focus, textarea:focus, select:focus, 
        [contenteditable="true"]:focus, [role="textbox"]:focus, [data-focusable="true"]:focus,
        input:focus-visible, textarea:focus-visible, select:focus-visible, 
        [contenteditable="true"]:focus-visible, [role="textbox"]:focus-visible, [data-focusable="true"]:focus-visible,
        input:active, textarea:active, select:active {
          outline: none !important;
          outline-style: none !important;
          outline-width: 0 !important;
          outline-color: transparent !important;
          box-shadow: none !important;
          -webkit-focus-ring-color: transparent !important;
        }
        *:focus {
          outline: none !important;
        }
        *:focus-visible {
          outline: none !important;
        }
      `;
      if (document.head) {
        document.head.appendChild(style);
      } else {
        document.documentElement.appendChild(style);
      }
    }
  };

  injectGlobalInputFocusReset();
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', injectGlobalInputFocusReset);
  }
}

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
