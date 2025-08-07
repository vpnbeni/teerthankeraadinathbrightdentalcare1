// Export all shared components
export { default as LoadingSpinner } from "./LoadingSpinner.jsx";
export { default as ErrorBoundary } from "./ErrorBoundary.jsx";
export { default as Toast } from "./Toast.jsx";
export { default as ConfirmDialog } from "./ConfirmDialog.jsx";
export { default as FormField } from "./FormField.jsx";

// Export new accessibility components
export {
  default as ResponsiveTable,
  UserTable,
  AppointmentTable,
} from "./ResponsiveTable.jsx";
export {
  default as AccessibleModal,
  ConfirmationModal,
  FormModal,
  InfoModal,
} from "./AccessibleModal.jsx";
export {
  default as AccessibleButton,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  SuccessButton,
  WarningButton,
  GhostButton,
  LinkButton,
  IconButton,
  ButtonGroup,
  ToggleButton,
} from "./AccessibleButton.jsx";

// Export navigation and UX components
export {
  default as Breadcrumb,
  UserBreadcrumb,
  AppointmentBreadcrumb,
  SettingsBreadcrumb,
} from "./Breadcrumb.jsx";
export {
  default as SearchAndFilter,
  UserSearch,
  AppointmentSearch,
} from "./SearchAndFilter.jsx";
export {
  default as KeyboardShortcuts,
  useKeyboardShortcuts,
} from "./KeyboardShortcuts.jsx";
export {
  default as OnboardingTooltips,
  AdminOnboardingTour,
  UserManagementTour,
} from "./OnboardingTooltips.jsx";
export { default as SkipLinks } from "./SkipLinks.jsx";

// Export accessibility testing components
export {
  default as AccessibilityTester,
  AccessibilitySettings,
} from "./AccessibilityTester.jsx";
