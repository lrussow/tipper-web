export interface LogEvent {
  timestamp: string;
  level: string;
  tag: string;
  message: string;
  throwable?: string;
  app: Record<string, string>;
  device: Record<string, string>;
  context: Record<string, string>;
}
