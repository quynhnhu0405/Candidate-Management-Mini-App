// Business error carrying an HTTP status + code. errorHandler turns it into { error: { code, message } }.
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
