const { GoogleGenAI } = require('@google/genai');

let ai = null;

try {
  // Initialize the SDK if an API key is available
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } else {
    console.warn('GEMINI_API_KEY is missing. AI features will not work.');
  }
} catch (error) {
  console.error('Failed to initialize Google Gen AI:', error);
}

// Reusable helper to call Gemini
async function callGemini(systemInstruction, prompt) {
  if (!ai) {
    throw new Error('Gemini AI is not configured on the server. Please add GEMINI_API_KEY.');
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7, // A bit of creativity for plain language
      },
    });

    return response.text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to generate AI insight.');
  }
}

/**
 * Generate a monthly summary of spending.
 */
async function generateSummary(stats) {
  const systemInstruction = `You are a helpful, encouraging financial assistant. 
Your goal is to summarize the user's monthly spending in a short, easy-to-read paragraph.
Use a friendly, conversational tone. Do NOT perform any math—just use the provided stats.
Keep it under 3 sentences. Highlight any interesting trends or major expenses.`;

  const prompt = `Here are my spending stats for the month:
Total Spent: ₹${stats.totalSpent}
Category Breakdown: 
${stats.categoryBreakdown.map(c => `- ${c.name}: ₹${c.amount}`).join('\n')}`;

  return await callGemini(systemInstruction, prompt);
}

/**
 * Generate a forecast based on the burn rate.
 */
async function generateForecast(forecastData) {
  const systemInstruction = `You are a helpful financial assistant. 
The user wants to know if they are on track to stay within their budget this month.
You will be given the current total spent, the daily average burn rate, the projected month-end total, and the overall budget.
Write a 1-2 sentence forecast. If they are projected to go over budget, give a gentle warning. If they are on track, encourage them!`;

  const prompt = `Here is my forecast data:
Current Spent: ₹${forecastData.currentSpent}
Daily Burn Rate: ₹${forecastData.burnRate}/day
Projected Month-End Total: ₹${forecastData.projectedTotal}
Total Monthly Budget: ₹${forecastData.totalBudget}`;

  return await callGemini(systemInstruction, prompt);
}

/**
 * Generate budget recommendations to hit a savings goal.
 */
async function generateRecommendations(priorities, savingsGoal, historicalAverages) {
  const systemInstruction = `You are a practical and realistic financial coach.
The user wants to save a specific amount of money next month.
They have provided their priorities (what is non-negotiable vs flexible) and their historical spending averages by category.
Suggest 2-3 concrete areas where they can cut spending to hit their savings goal.
Respect their priorities (do not suggest cutting non-negotiable categories).
Provide the response as a bulleted list.`;

  const prompt = `My Savings Goal: ₹${savingsGoal}
My Priorities: ${priorities}
My Historical Monthly Averages:
${historicalAverages.map(c => `- ${c.name}: ₹${c.average}`).join('\n')}`;

  return await callGemini(systemInstruction, prompt);
}

/**
 * Evaluate an impulse purchase.
 */
async function generateImpulseVerdict(amount, category, priorities, remainingBudget, burnRate) {
  const systemInstruction = `You are a financial coach. The user wants to make a spontaneous purchase of ₹${amount} in the '${category}' category.
    
    Here is their financial situation for this month:
    - Remaining budget for the month: ₹${remainingBudget}
    - Average daily spending so far: ₹${burnRate}
    - Stated priorities: "${priorities}"

    Give a concise, actionable verdict (2-3 sentences) on whether they should make this purchase.
    Do NOT just say "yes" or "no". Use the numbers provided to justify your reasoning. If it puts them over budget or conflicts with priorities, tell them why it's a bad idea.`;

  const prompt = `Purchase: ₹${amount} in category '${category}'
My Priorities: ${priorities}
Remaining Budget: ₹${remainingBudget}
Current Daily Burn Rate: ₹${burnRate}/day`;

  return await callGemini(systemInstruction, prompt);
}

module.exports = {
  generateSummary,
  generateForecast,
  generateRecommendations,
  generateImpulseVerdict
};
