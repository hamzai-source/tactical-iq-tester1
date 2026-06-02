export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { difficulty } = req.body;
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    let prompt = "";
    if (difficulty === 'easy') {
        prompt = `Generate a simple but engaging tactical scenario for a football management game. 
Include: a catchy title, a 3-4 sentence detailed description of the match situation (score, time, momentum), opponent formation (e.g., "4-3-3"), 
a small ASCII formation diagram, and an empty setbacks array.

Be creative but realistic. Return ONLY JSON:
{
    "title": "Easy: [unique name]",
    "description": "[3-4 sentences with specific details like '75th minute, you're down 1-0, opponent playing a compact 4-4-2...']",
    "opponentFormation": "4-3-3",
    "formationDiagram": "    GK\\n   CB CB\\nLB       RB\\n  CM CM CM\\n LW   ST   RW",
    "setbacks": []
}`;
    } else if (difficulty === 'medium') {
        prompt = `Generate a medium‑difficulty scenario with 1 meaningful setback (e.g., tired players, yellow cards, or a key player injured). 
Use 4-5 sentences to build tension. Include formation and ASCII diagram.
Return ONLY JSON:
{
    "title": "Medium: [name]",
    "description": "[4-5 sentences describing the critical moment, the setback, and what's at stake]",
    "opponentFormation": "4-4-2",
    "formationDiagram": "...",
    "setbacks": ["Your midfield has covered 12km each – pressing efficiency is 40% lower"]
}`;
    } else {
        prompt = `Generate a HARD scenario with 2 or more serious setbacks (red card, key player benched, exhausted squad, etc.). 
Make the description intense (6+ sentences). Use dramatic language.
Return ONLY JSON:
{
    "title": "Hard: [name]",
    "description": "[Very detailed, dramatic description of the nightmare situation]",
    "opponentFormation": "3-5-2",
    "formationDiagram": "...",
    "setbacks": ["Red card – your captain sent off at 70'", "Star striker in terrible form – can't be subbed", "Two defenders on yellow cards"]
}`;
    }

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
                model: 'google/gemini-2.0-flash-exp:free',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.8
            })
        });

        const data = await response.json();
        let aiResponse = data.choices[0].message.content;
        aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const result = JSON.parse(aiResponse);
        res.status(200).json(result);
    } catch (error) {
        // Enhanced fallback scenarios
        const fallbacks = {
            easy: {
                title: "Easy: First Half Pressure",
                description: "42nd minute, 0-0. The opponent is pressing high but leaving gaps behind. Your wingers have clear pace advantage. The home crowd is getting anxious.",
                opponentFormation: "4-3-3",
                formationDiagram: "    GK\n   CB CB\nLB       RB\n  CM CM CM\n LW   ST   RW",
                setbacks: []
            },
            medium: {
                title: "Medium: Second Half Survival",
                description: "75th minute, you're leading 1-0 away. The opponent has brought on two fresh wingers. Your midfield has covered 12km each – pressing efficiency is 40% lower. They are throwing everything forward.",
                opponentFormation: "4-4-2",
                formationDiagram: "    GK\n   CB CB\nLB       RB\nLM  CM CM  RM\n   ST ST",
                setbacks: ["Tired midfield – pressing efficiency dropped 40%"]
            },
            hard: {
                title: "Hard: Relegation Nightmare",
                description: "80th minute, you're 2-0 down. Your best defender was sent off at 70'. Your star striker is playing terribly (2.5 rating) but can't be subbed. Two other players are on yellow cards. The away fans are chanting 'You're getting sacked in the morning'. The pressure is immense.",
                opponentFormation: "3-5-2",
                formationDiagram: "    GK\n  CB CB CB\nLWB         RWB\n  CM CM CM\n    ST ST",
                setbacks: ["Red card (75th min) – playing with 10 men", "Star striker in terrible form – can't be subbed", "Two players on yellow cards"]
            }
        };
        res.status(200).json(fallbacks[difficulty]);
    }
}
