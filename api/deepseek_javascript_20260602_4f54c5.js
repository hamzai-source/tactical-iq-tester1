export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { difficulty } = req.body;
    
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    let prompt = "";
    if (difficulty === 'easy') {
        prompt = `Generate a simple tactical scenario for a football management game. 
        Include: title (short), description (2 sentences), opponent formation (e.g., "4-3-3"), 
        and a simple formation diagram using text/ASCII.
        Also include an empty "setbacks" array.
        
        Return ONLY JSON:
        {
            "title": "Easy Scenario: [name]",
            "description": "[2 sentence description of match situation]",
            "opponentFormation": "4-3-3",
            "formationDiagram": "[simple ASCII formation]",
            "setbacks": []
        }`;
    } else if (difficulty === 'medium') {
        prompt = `Generate a detailed tactical scenario with 1 setback.
        Include: title, detailed description (3-4 sentences), opponent formation, 
        formation diagram, and exactly 1 setback like "tired players" or "player on yellow card".
        
        Return ONLY JSON:
        {
            "title": "Medium Scenario: [name]",
            "description": "[3-4 sentence description with a specific match situation]",
            "opponentFormation": "4-4-2",
            "formationDiagram": "[ASCII formation]",
            "setbacks": ["Tired midfielders - they've played 3 matches in 10 days"]
        }`;
    } else {
        prompt = `Generate a brutal tactical scenario with 2+ setbacks.
        Include: title, intense description (4-5 sentences), opponent formation,
        formation diagram, and at least 2 setbacks (red card, injuries, exhausted players, benched star, etc.)
        
        Return ONLY JSON:
        {
            "title": "Hard Scenario: [name]",
            "description": "[4-5 sentence intense description]",
            "opponentFormation": "3-5-2",
            "formationDiagram": "[ASCII formation]",
            "setbacks": ["Red card - your best defender sent off at 70th minute", "Star striker playing poorly - can't be subbed", "Two players on yellow cards"]
        }`;
    }

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
                temperature: 0.8
            })
        });

        const data = await response.json();
        let aiResponse = data.choices[0].message.content;
        aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const result = JSON.parse(aiResponse);
        
        res.status(200).json(result);
    } catch (error) {
        // Fallback scenarios
        const fallbacks = {
            easy: {
                title: "Easy: First Half Pressure",
                description: "You're playing against a mid-table team. They're pressing high but leaving gaps behind. Your wingers have pace advantage.",
                opponentFormation: "4-3-3",
                formationDiagram: "    GK\n   CB CB\nLB       RB\n  CM CM CM\n LW   ST   RW",
                setbacks: []
            },
            medium: {
                title: "Medium: Second Half Survival",
                description: "You're leading 1-0 away from home. The opponent has brought on fresh attackers. Your midfield is exhausted after pressing for 70 minutes.",
                opponentFormation: "4-4-2",
                formationDiagram: "    GK\n   CB CB\nLB       RB\nLM  CM CM  RM\n   ST ST",
                setbacks: ["Tired midfield - pressing efficiency dropped 40%"]
            },
            hard: {
                title: "Hard: Relegation Nightmare",
                description: "You're 2-0 down at halftime. Your best defender got a red card. Your star striker has played terribly. Two other players are on yellow cards. The away fans are chanting for your sacking.",
                opponentFormation: "3-5-2",
                formationDiagram: "    GK\n  CB CB CB\nLWB         RWB\n  CM CM CM\n    ST ST",
                setbacks: ["Red card (75th min) - playing with 10 men", "Star striker in bad form - can't be subbed", "Two players on yellow cards"]
            }
        };
        res.status(200).json(fallbacks[difficulty]);
    }
}