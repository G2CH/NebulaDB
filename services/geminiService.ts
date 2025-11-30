import { GoogleGenAI } from "@google/genai";

const getGeminiClient = () => {
  const apiKey = localStorage.getItem('gemini_api_key') || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please configure it in Settings.");
  }
  return new GoogleGenAI({ apiKey });
};

interface GenerateSqlOptions {
  connectionId: string;
  database: string | null;
  connectionType: string;
  userPrompt: string;
}

export const generateSqlFromPrompt = async (options: GenerateSqlOptions): Promise<string> => {
  try {
    const ai = getGeminiClient();

    // Extract real schema from the database
    const { extractDatabaseSchema, formatSchemaForAI } = await import('./schemaService');
    const schema = await extractDatabaseSchema(
      options.connectionId,
      options.database,
      options.connectionType
    );
    const schemaDescription = formatSchemaForAI(schema);

    const systemInstruction = `You are an expert SQL dialect generator for ${options.connectionType.toUpperCase()}.
    
Given the following database schema:
${schemaDescription}
    
Generate a valid SQL query based on the user's natural language request.
Do not add markdown code blocks (e.g. \`\`\`sql). Just return the raw SQL string.
If the request is ambiguous, default to selecting all columns with a limit of 100.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: options.userPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Low temperature for deterministic code generation
      },
    });

    return response.text?.trim() || "-- Could not generate SQL";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `-- Error generating SQL: ${(error as Error).message}`;
  }
};

export const explainQuery = async (query: string): Promise<string> => {
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Explain what this SQL query does in one concise sentence: ${query}`,
    });
    return response.text?.trim() || "";
  } catch (error) {
    return "";
  }
};
