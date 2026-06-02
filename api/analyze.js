export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { difficulty, scenario, tactics, managerLevel } = req.body;
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    const prompt = `You are a brutally honest, hilarious football tactical analyst.

DIFFICULTY: ${difficulty.toUpperCase()}
OPPONENT FORMATION: ${scenario.opponentFormation}
SETBACKS: ${scenario.setbacks ? scenario.setbacks.join(', ') : 'None'}
SCENARIO: ${scenario.description}
MANAGER LEVEL: ${managerLevel}

MANAGER'S TACTICAL CHANGES:
"${tactics}"

Evaluate their tactics. Return ONLY JSON:
{
    "rating": 7.5,
    "outcome": "WIN/DRAW/LOSS",
    "narrative": "3-4 sentence dramatic match narrative based on their tactics",
    "strengths": "• What they did well\n• Second point",
    "weaknesses": "• What they missed\n• Second point",
    "improvements": "• What they should have done differently\n• Second point",
    "roast": "One brutal roast line like 'The kit man would have done better'"
}

Rating guide: 1-3 Terrible, 4-5 Poor, 6-7 Average, 8-9 Very Good, 10 World Class.`;

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://tactical-lq-tester1.vercel.app',
                'X-Title': 'Tactical IQ Tester'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-exp:free',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.9
            })
        });

        const data = await response.json();
        let aiResponse = data.choices[0].message.content;
        aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const result = JSON.parse(aiResponse);
        
        res.status(200).json(result);
    } catch (error) {
        res.status(200).json({
            rating: 6.0,
            outcome: "DRAW",
            narrative: "The match was chaotic. Your tactics showed some promise but lacked execution.",
            strengths: "• You identified the formation\n• Good effort in describing changes",
            weaknesses: "• Tactics lacked specific detail\n• Didn't address opponent's strengths",
            improvements: "• Be more specific about positioning\n• Address the specific formation weaknesses",
            roast: "The AI had a stroke trying to understand your tactics."
        });
    }
}
