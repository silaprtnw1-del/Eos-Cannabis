export type Ok<T> = { data: T; error: null };
export type Err = { data: null; error: Error };
export type Result<T> = Ok<T> | Err;

export const ok = <T>(data: T): Ok<T> => ({ data, error: null });
export const err = (error: unknown): Err => ({
  data: null,
  error: error instanceof Error ? error : new Error(String(error)),
});
