// Re-export colors for backward compatibility
export * from './colors';

// Import style classes
import {AppText} from './app-text.style';
import {AppView} from './app-view.style';
import {AppColors} from './app-colors.style';

// Unified $ export combining all style instances (following reference pattern)
export const $ = {
  ...AppColors.instance,
  ...AppView.instance,
  ...AppText.instance,
};
