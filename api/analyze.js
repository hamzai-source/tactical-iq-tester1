export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { difficulty, scenario, tactics, managerLevel } = req.body;
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
        console.error('Missing OPENROUTER_API_KEY');
        return res.status(500).json({ error: 'Server misconfiguration: missing API key' });
    }

    // Use the latest Gemini 3 Flash Preview model
    const model = 'google/gemini-3-flash-preview';

    const prompt = `You are a legendary, sarcastic, and highly creative football tactical analyst. Your task is to evaluate the manager's submitted plan and produce a UNIQUE, DRAMATIC, AND DETAILED response. NEVER use generic phrases like "your plan lacked detail" or "you didn't specify". Always refer to specific formations, player movements, and timestamps.

DIFFICULTY: ${difficulty.toUpperCase()}
OPPONENT FORMATION: ${scenario.opponentFormation}
SETBACKS: ${scenario.setbacks ? scenario.setbacks.join(', ') : 'None'}
SCENARIO: ${scenario.description}
MANAGER'S TACTICS: "${tactics}"
MANAGER LEVEL: ${managerLevel}

IMPORTANT RULES:
- Rating must be BETWEEN 1.0 AND 10.0, and MUST VARY. Do not give 5.5 every time. If tactics are brilliant, give 8.5-9.5. If terrible, give 2.0-4.0.
- The "tacticalBoard" field MUST contain ASCII diagrams or creative visual formatting (like in the examples: use arrows, brackets, player positions). Make it at least 6 lines long.
- The "whyItWorkedOrFailed" MUST quote the manager's own words and explain exactly what happened in a specific minute (e.g., "83rd minute – your instruction to 'drop deep' allowed...").
- The "dramaSequence" MUST be a minute-by-minute thriller with timestamps (e.g., "82' — ...", "87' — ...", "90+3' — ...") and end with a final score.

Return ONLY valid JSON. No extra text. Use this exact structure:

{
    "rating": 7.8,
    "outcome": "WIN",
    "tacticalBoard": "A detailed, visual tactical explanation with ASCII art. Minimum 6 lines.",
    "whyItWorkedOrFailed": "2-3 paragraphs, quoting the manager's tactics, explaining key moments with specific minutes.",
    "dramaSequence": "Minute-by-minute narrative: '75' — ...', '82' — ...', '90+2' — ... Final score: 2-1.'"
}`;

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
                temperature: 1.0  // High creativity
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter error:', response.status, errorText);
            throw new Error(`API returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        let aiResponse = data.choices[0].message.content;
        aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const result = JSON.parse(aiResponse);
        
        // Validate rating
        let rating = parseFloat(result.rating);
        if (isNaN(rating)) rating = 6.0;
        result.rating = Math.min(10, Math.max(1, rating));
        
        res.status(200).json(result);
    } catch (error) {
        console.error('AI Error:', error);
        // Return a clear error so user knows what's wrong
        res.status(500).json({ 
            error: 'AI service failed. Check your OpenRouter API key and that Gemini 3 Flash is available.',
            details: error.message
        });
    }
}
