import * as handlebars from 'handlebars';

export async function renderTemplate(template: string, variables: Record<string, any>): Promise<string> {
  const compiledTemplate = handlebars.compile(template);
  return compiledTemplate(variables);
}