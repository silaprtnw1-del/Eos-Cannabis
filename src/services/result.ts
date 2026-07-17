export type Ok<T> = { data: T; error: null };
export type Err = { data: null; error: Error };
export type Result<T> = Ok<T> | Err;

export const ok = <T>(data: T): Ok<T> => ({ data, error: null });

// Supabase query errors (PostgrestError, AuthError, ...) are plain objects
// with a string `message`, not real Error instances — String(obj) would
// collapse them to "[object Object]" and lose the actual message.
const hasStringMessage = (e: unknown): e is { message: string } =>
  typeof e === 'object' && e !== null && typeof (e as any).message === 'string';

export const err = (error: unknown): Err => ({
  data: null,
  error:
    error instanceof Error
      ? error
      : new Error(hasStringMessage(error) ? error.message : String(error)),
});

/** Unwraps a Result for use in React Query queryFn/mutationFn, which expect a throw on failure. */
export const unwrap = <T>(result: Result<T>): T => {
  if (result.error) throw result.error;
  return result.data;
};

/** True for fetch-level failures (no connectivity), false for server/validation/auth errors. */
export const isNetworkError = (error: Error): boolean =>
  /network request failed|failed to fetch|fetch failed|unable to resolve host|unknownhostexception|no address associated|network is unreachable|econnrefused|enotfound|etimedout/i.test(
    error.message
  );
