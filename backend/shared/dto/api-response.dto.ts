export class ApiResponseDto<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp: string;
  path?: string;

  static success<T>(data: T, message?: string): ApiResponseDto<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  static error(message: string, error?: string, path?: string): ApiResponseDto {
    return {
      success: false,
      message,
      error,
      path,
      timestamp: new Date().toISOString(),
    };
  }
}
