import Groq from "groq-sdk";
import { ExtractionProvider, ExtractionProviderError } from "./extractionProvider";

const DEFAULT_MODEL = "openai/gpt-oss-20b";

const SYSTEM_PROMPT = `You extract personal-relationship information from casual text about people the user has met.

Rules:
- Only extract information that is explicitly stated or clearly implied. Never guess or invent details.
- If a piece of information is not stated, use null (for single values) or an empty array (for lists). Do not fabricate a plausible-sounding value.
- If the text describes multiple people, create one candidate per person and attribute facts/organizations/contacts to the correct person using pronouns and context.
- Do not invent a last name, city, country, or organization that was not stated.
- Preserve uncertainty: if something is ambiguous, prefer omitting it over guessing.`;

/**
 * Hand-written, not derived from the Zod candidate schema. Groq's strict
 * structured-output mode only accepts a narrow JSON Schema subset (every
 * property must be in `required`, `default`/`minLength` are unsupported,
 * root must be an object). Reconciling z.toJSONSchema()'s general-purpose
 * output with that subset would need its own recursive post-processor with
 * undocumented edge cases; a static literal is simpler and has no hidden
 * behavior. Zod (candidateSchemas.ts) remains the actual validation
 * authority regardless of what this schema looks like -- see
 * jsonSchemaDriftCheck.test.ts, which fails if the property sets here and
 * in candidateSchemas.ts diverge.
 */
export const PERSON_CANDIDATE_BATCH_JSON_SCHEMA = {
  type: "object",
  properties: {
    people: {
      type: "array",
      items: {
        type: "object",
        properties: {
          person: {
            type: "object",
            properties: {
              firstName: { type: ["string", "null"] },
              lastName: { type: ["string", "null"] },
              currentCity: { type: ["string", "null"] },
              currentCountry: { type: ["string", "null"] },
              headline: { type: ["string", "null"] },
            },
            required: [
              "firstName",
              "lastName",
              "currentCity",
              "currentCountry",
              "headline",
            ],
            additionalProperties: false,
          },
          contacts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: [
                    "linkedin",
                    "instagram",
                    "phone",
                    "email",
                    "whatsapp",
                    "x",
                    "other",
                  ],
                },
                value: { type: "string" },
                normalizedValue: { type: ["string", "null"] },
                isPrimary: { type: ["boolean", "null"] },
              },
              required: ["type", "value", "normalizedValue", "isPrimary"],
              additionalProperties: false,
            },
          },
          organizations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                organizationName: { type: "string" },
                organizationType: { type: ["string", "null"] },
                relationship: { type: ["string", "null"] },
                title: { type: ["string", "null"] },
                isCurrent: { type: ["boolean", "null"] },
                knownYear: { type: ["integer", "null"] },
              },
              required: [
                "organizationName",
                "organizationType",
                "relationship",
                "title",
                "isCurrent",
                "knownYear",
              ],
              additionalProperties: false,
            },
          },
          connections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                context: { type: "string" },
                locationWhereMet: { type: ["string", "null"] },
                introducedBy: { type: ["string", "null"] },
                details: { type: ["string", "null"] },
                dateMet: { type: ["string", "null"] },
              },
              required: [
                "context",
                "locationWhereMet",
                "introducedBy",
                "details",
                "dateMet",
              ],
              additionalProperties: false,
            },
          },
          facts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                value: { type: "string" },
                details: { type: ["string", "null"] },
              },
              required: ["category", "value", "details"],
              additionalProperties: false,
            },
          },
          interactions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                interactionDate: { type: ["string", "null"] },
                type: { type: ["string", "null"] },
                summary: { type: "string" },
                followUp: { type: ["string", "null"] },
              },
              required: ["interactionDate", "type", "summary", "followUp"],
              additionalProperties: false,
            },
          },
        },
        required: [
          "person",
          "contacts",
          "organizations",
          "connections",
          "facts",
          "interactions",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["people"],
  additionalProperties: false,
} as const;

export class GroqExtractionProvider implements ExtractionProvider {
  private readonly client: Groq;
  private readonly model: string;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    this.client = new Groq({ apiKey });
    this.model = model;
  }

  async extractCandidates(text: string): Promise<unknown> {
    const completion = await this.runCompletion(text);
    const content = completion.choices[0]?.message.content;

    if (!content) {
      throw new ExtractionProviderError(
        "Groq returned an empty extraction response.",
      );
    }

    return this.parseJsonContent(content);
  }

  private async runCompletion(text: string) {
    try {
      return await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "person_candidate_batch",
            strict: true,
            schema: PERSON_CANDIDATE_BATCH_JSON_SCHEMA,
          },
        },
      });
    } catch (error) {
      throw new ExtractionProviderError(
        "Groq extraction request failed.",
        { cause: error },
      );
    }
  }

  private parseJsonContent(content: string): unknown {
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new ExtractionProviderError(
        "Groq returned a response that was not valid JSON.",
        { cause: error },
      );
    }
  }
}
