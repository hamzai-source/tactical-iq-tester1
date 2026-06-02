export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { scenario, tactics, managerLevel } = req.body;

    if (!tactics) {
        return res.status(400).json({ error: 'No tactics provided' });
    }

    // Get your OpenRouter API key from environment variables
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    const prompt = `You are a professional football tactical analyst. Analyze this manager's strategy.

SCENARIO: ${scenario}
MANAGER LEVEL: ${managerLevel}

MANAGER'S TACTICAL PLAN:
"${tactics}"

Respond with ONLY valid JSON in this exact format:
{
    "rating": 7.5,
    "narrative": "A 2-3 sentence description of what happened in the match based on their tactics",
    "strengths": "2-3 bullet points of what they did well",
    "weaknesses": "2-3 bullet points of what they could improve"
}

Rate from 1.0 to 10.0 (1 = terrible, 10 = world-class). Be harsh but fair.`;

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://tactical-iq-pro.vercel.app',
                'X-Title': 'Tactical IQ Pro'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-exp:free',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7
            })
        });

        const data = await response.json();
        let aiResponse = data.choices[0].message.content;
        
        // Clean up the response
        aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const result = JSON.parse(aiResponse);
        
        res.status(200).json(result);
    } catch (error) {
        console.error('AI Error:', error);
        // Fallback response if AI fails
        res.status(200).json({
            rating: 6.5,
            narrative: "Your tactics showed some promise but lacked specific details.",
            strengths: "Good effort in describing your approach.",
            weaknesses: "More specific tactical instructions would help."
        });
    }
}