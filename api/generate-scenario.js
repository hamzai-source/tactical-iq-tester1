export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { difficulty } = req.body;
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
        return res.status(500).json({ error: 'Missing OpenRouter API key' });
    }

    const model = 'google/gemini-3-flash-preview';

    const prompt = `Generate a unique, highly detailed tactical scenario for a football management game. 
Difficulty: ${difficulty.toUpperCase()}
Requirements:
- Title: Creative and catchy (e.g., "The Catenaccio Trap", "High Press Suicide")
- Description: 4-5 sentences with specific score, time, player conditions, and opponent behavior. Be vivid.
- Formation: Realistic (e.g., "4-3-3", "3-5-2", "5-4-1")
- Setbacks: If difficulty is 'medium', exactly 1 setback; if 'hard', 2 or 3 setbacks; if 'easy', empty array.
- Formation diagram: Simple ASCII art (like the example).

Return ONLY valid JSON. No extra text.

Example of good formation diagram:
    GK
   CB CB
LB      RB
  CM CM
LW   ST   RW

Now generate a scenario. Make it original and dramatic.`;

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://tactical-iq-tester.vercel.app',
                'X-Title': 'Tactical IQ Tester'
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.9
            })
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        let aiResponse = data.choices[0].message.content;
        aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const result = JSON.parse(aiResponse);
        res.status(200).json(result);
    } catch (error) {
        console.error('Scenario generation error:', error);
        // Fallback scenarios (same as before)
        const fallbacks = {
            easy: {
                title: "Easy: The Early Kickoff Fog",
                description: "8th minute, still 0-0. The opposition is playing a high line with a slow center-back. Your striker has 15 pace advantage. The morning fog is lifting, but your players are still sleepy.",
                opponentFormation: "4-3-3",
                formationDiagram: "    GK\n   CB CB\nLB       RB\n  CM CM CM\n LW   ST   RW",
                setbacks: []
            },
            medium: {
                title: "Medium: The Yellow Card Minefield",
                description: "65th minute, 1-1. Three of your key players are on yellow cards. The opposition is targeting them with aggressive dribbles. Your left-back is one foul away from suspension. The crowd is roaring for every tackle.",
                opponentFormation: "4-4-2",
                formationDiagram: "    GK\n   CB CB\nLB       RB\nLM  CM CM  RM\n   ST ST",
                setbacks: ["Three players on yellow cards (including captain)", "Opposition winger has 90% dribble success rate"]
            },
            hard: {
                title: "Hard: The 9-Man War",
                description: "82nd minute, 2-2, but you have TWO red cards. Your goalkeeper is the only senior player left. The opposition has brought on a 6'5\" target man. Your center-backs are both 18-year-olds making their debut. The stadium is a cauldron of noise. You are clinging on.",
                opponentFormation: "3-5-2",
                formationDiagram: "    GK\n  CB CB CB\nLWB         RWB\n  CM CM CM\n    ST ST",
                setbacks: ["Two red cards (playing with 9 men)", "Both center-backs are academy debutants", "Goalkeeper has a broken finger"]
            }
        };
        res.status(200).json(fallbacks[difficulty]);
    }
}
