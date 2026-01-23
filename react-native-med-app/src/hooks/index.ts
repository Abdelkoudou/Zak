// ============================================================================
// Hooks Index - Clean exports for TanStack Query hooks
// ============================================================================

// Modules
export {
  useModulesWithCounts,
  useModulesOfflineFirst,
  useModuleById,
  usePrefetchModules,
  type ModuleWithCount,
} from './useModules';

// Questions
export {
  useQuestions,
  useQuestionById,
  useQuestionCount,
  useExamYears,
  usePrefetchQuestions,
  type QuestionFilters,
} from './useQuestions';

// Saved Questions
export {
  useSavedQuestionIds,
  useSavedQuestions,
  useToggleSaveQuestion,
  useIsQuestionSaved,
} from './useSavedQuestions';
