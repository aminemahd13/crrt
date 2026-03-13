declare module "html-to-text" {
  interface ConvertOptions {
    wordwrap?: number;
    selectors?: Array<{
      selector: string;
      options?: Record<string, unknown>;
    }>;
  }

  export function convert(input: string, options?: ConvertOptions): string;
}
