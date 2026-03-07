export class SlugUtil {
  static generate(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static generateUnique(base: string, existing: string[]): string {
    let slug = this.generate(base);
    let counter = 1;
    
    while (existing.includes(slug)) {
      slug = `${this.generate(base)}-${counter}`;
      counter++;
    }
    
    return slug;
  }

  static isValid(slug: string): boolean {
    return /^[a-z0-9-]+$/.test(slug) && slug.length > 0;
  }
}
