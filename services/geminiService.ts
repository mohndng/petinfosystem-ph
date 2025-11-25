import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  // NOTE: In a real production app, this should be a backend call to protect the key.
  // For this client-side demo as per instructions, we access env directly.
  if (!process.env.API_KEY) {
    console.warn("API_KEY is missing. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateBarangayReport = async (
  stats: { totalPets: number; vaccinatedCount: number; incidentCount: number; strayCount: number },
  purokStats: Record<string, number>
) => {
  const ai = getAiClient();
  if (!ai) return "API Key missing. Unable to generate report.";

  const prompt = `
    Act as a professional Veterinary Public Health Analyst for a local Barangay in the Philippines.
    Write a formal **Executive Summary** addressed to the Barangay Captain.
    
    **Data Provided:**
    - Total Registered Pets: ${stats.totalPets}
    - Fully Vaccinated: ${stats.vaccinatedCount}
    - Recent Bite Incidents: ${stats.incidentCount}
    - Stray Animal Reports: ${stats.strayCount}
    - Distribution per Purok: ${JSON.stringify(purokStats)}

    **Instructions:**
    1. Make it **detailed but concise**. Avoid fluff. Direct to the point.
    2. Use **Bold** syntax (surround with double asterisks) for Section Headers, Key Metrics, and Risk Levels. 
    3. Do NOT use markdown header symbols (#).
    4. Structure the report into these specific sections:
       - **Situation Overview**: Summary of population and coverage.
       - **Public Health Risk Assessment**: Analyze the vaccination gap and incident correlation.
       - **Operational Recommendations**: Specific actionable steps for the Barangay Council (e.g., Mass Vaccination, Stray Catching).

    Tone: Official, Urgent (if risk is high), and Professional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI Generation failed:", error);
    return "Failed to generate report. Please try again later.";
  }
};