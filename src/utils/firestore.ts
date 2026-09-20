/**
 * Utility functions for Firestore data management and payload sanitization.
 */

/**
 * Recursively removes all `undefined` values from an object or array.
 * Firestore strictly forbids `undefined` field values in `setDoc`, `addDoc`, and `updateDoc`.
 */
export function removeUndefinedFields<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => removeUndefinedFields(item)) as unknown as T;
  }

  if (typeof input === 'object') {
    if (input instanceof Date) {
      return input;
    }

    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(input as Record<string, any>)) {
      if (value !== undefined) {
        result[key] = removeUndefinedFields(value);
      }
    }
    return result as T;
  }

  return input;
}
