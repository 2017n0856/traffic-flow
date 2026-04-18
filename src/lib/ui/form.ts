/**
 * Shared form and page typography. Use across auth forms and portal UI.
 * — Page titles: text-2xl font-semibold
 * — Section titles: text-lg font-semibold
 * — Labels & control text: text-sm font-medium
 * — Inputs/selects/textarea: text-sm font-normal
 * — Helper / secondary: text-xs text-zinc-500
 * — Field errors: text-sm (readable minimum)
 */

export const pageTitleClass =
  "text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50";

export const sectionTitleClass =
  "text-lg font-semibold text-zinc-900 dark:text-zinc-50";

export const panelTitleClass =
  "text-base font-semibold text-zinc-900 dark:text-zinc-50";

export const bodyMutedClass = "text-sm text-zinc-600 dark:text-zinc-400";

export const formLabelClass =
  "text-sm font-medium text-zinc-700 dark:text-zinc-300";

export const formHelperClass = "text-xs text-zinc-500 dark:text-zinc-400";

export const formFieldErrorClass =
  "text-sm text-red-600 dark:text-red-400";

export const formInputBaseClass =
  "block w-full rounded-lg border px-3 py-2 text-sm font-normal leading-normal shadow-sm outline-none ring-zinc-400/40 placeholder:text-zinc-400 placeholder:font-normal focus:ring-2 dark:ring-zinc-600/40";

export const primaryButtonClass =
  "inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200";

/** Outline / secondary actions (toolbar links, cancel, etc.) */
export const secondaryButtonClass =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900";

export const tableHeaderClass =
  "text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400";

export const formControlClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-normal text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

export const textLinkClass =
  "text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50";

/** Large emphasis (admin + user dashboard / report): bigger type; labels semibold */
export const largeSecondaryButtonClass =
  "rounded-md border border-zinc-300 px-3 py-2 text-base font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900";

export const adminPageTitleClass =
  "text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50";

export const adminSectionTitleClass =
  "text-xl font-semibold text-zinc-900 dark:text-zinc-50";

export const adminPanelTitleClass =
  "text-lg font-semibold text-zinc-900 dark:text-zinc-50";

export const adminBodyMutedClass =
  "text-base text-zinc-600 dark:text-zinc-400";

export const adminFormLabelClass =
  "text-base font-semibold text-zinc-800 dark:text-zinc-200";

export const adminFormControlClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base font-normal text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

export const adminFormFieldErrorClass =
  "text-base text-red-600 dark:text-red-400";

export const adminTableHeaderClass =
  "text-left text-sm font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400";

export const adminStatLabelClass =
  "text-sm font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400";
