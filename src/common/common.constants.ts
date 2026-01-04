export const ERROR_MESSAGES = {
  DUPLICATE: (field: string, value: string) =>
    `Duplicate value for field: ${field} (${value})`,
} as const;
