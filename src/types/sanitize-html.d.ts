declare module "sanitize-html" {
  interface IDefaults {
    allowedTags: string[];
    allowedAttributes: Record<string, string[]>;
  }

  interface IOptions {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
    allowedSchemes?: string[];
    transformTags?: Record<string, unknown>;
  }

  interface ISanitizeHtml {
    (input: string, options?: IOptions): string;
    defaults: IDefaults;
    simpleTransform(tagName: string, attribs?: Record<string, string>): unknown;
  }

  const sanitizeHtml: ISanitizeHtml;
  export default sanitizeHtml;
}
