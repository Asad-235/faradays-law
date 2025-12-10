import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const explainPhysics = async (
  currentEmf: number,
  currentFlux: number,
  velocity: number,
  turns: number
): Promise<string> => {
  if (!apiKey) {
    return "API Key is missing. Please configure the environment to use the AI tutor.";
  }

  try {
    const prompt = `
      You are a physics tutor explaining Faraday's Law of Induction to a student looking at a simulation.
      
      Current Simulation State:
      - Induced EMF: ${currentEmf.toFixed(2)} Volts (Arbitrary Units)
      - Magnetic Flux: ${currentFlux.toFixed(2)} Weber (Arbitrary Units)
      - Magnet Velocity: ${velocity.toFixed(2)} units/s
      - Number of Coil Turns: ${turns}

      Based on this specific moment, explain what is happening.
      - If EMF is near zero but Flux is high, explain why (rate of change is zero).
      - If EMF is high, explain the relationship between speed, turns, and flux change.
      - Keep it brief (max 3 sentences), encouraging, and educational.
      - Do not use LaTeX formatting, just plain text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "I couldn't generate an explanation at this moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The AI tutor is currently unavailable. Please check your connection or API key.";
  }
};
