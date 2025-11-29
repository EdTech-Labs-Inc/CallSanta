/**
 * Structured logging for video worker
 */

export function log(step: string, message: string, data?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  console.log(`[${timestamp}] [${step}] ${message}${dataStr}`);
}

export function logError(step: string, message: string, error?: unknown): void {
  const timestamp = new Date().toISOString();
  const errorStr = error instanceof Error ? error.message : String(error);
  console.error(`[${timestamp}] [${step}] ERROR: ${message} - ${errorStr}`);
}
