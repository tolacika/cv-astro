import { createLlmInput, generateLlmPrompt } from "../lib/generator";

export const partial = true;
export const prerender = true;

export async function GET() {
  const input = await createLlmInput();

  const body = generateLlmPrompt(input);

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain",
    }
  });
}