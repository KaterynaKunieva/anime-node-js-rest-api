export const EPISODE_CONFIG = {
  MAX_FUTURE_RELEASE_YEARS: 10,
  MIN_ORDER_TO_WATCH_NUMBER: 0,
  MAX_SIZE_ID_LIST: 100,
};

export const REQUEST_CONFIG = {
  TIMEOUT: 2000,
};

export const EPISODE_VALIDATION_MESSAGES = {
  ANIME_NOT_FOUND: (id: string) => `Anime with id ${id} doesn't exist`,
  RELEASE_BEFORE_ANIME: (date: string) =>
    `Episode release date cannot be before anime start: ${date}`,
  RELEASE_TOO_FUTURE: (year: number) =>
    `Release date is too far in the future (max: ${year})`,
} as const;
