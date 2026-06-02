export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { difficulty, scenario, tactics, managerLevel } = req.body;
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    const prompt = `You are a brilliant, poetic football tactical analyst. Your task is to evaluate the manager's submitted plan and produce a **dramatic, detailed, formation‑specific match narrative** in the style of a tactical genius.

DIFFICULTY: ${difficulty.toUpperCase()}
OPPONENT FORMATION: ${scenario.opponentFormation}
SETBACKS: ${scenario.setbacks ? scenario.setbacks.join(', ') : 'None'}
SCENARIO CONTEXT: ${scenario.description}
MANAGER'S TACTICS: "${tactics}"
MANAGER LEVEL: ${managerLevel}

Now, **ignore generic feedback**. Instead, write a vivid, step‑by‑step breakdown of what happened in the match based on their tactics. Use dramatic language, formations, and specific moments. **The response must be ONLY valid JSON** with these fields:

{
    "rating": (number 1-10),
    "outcome": "WIN/DRAW/LOSS",
    "tacticalBoard": "A detailed, visually formatted tactical explanation (use ASCII art if helpful) describing how the manager's setup worked or failed against the opponent's formation. Explain specific positional battles, pressing traps, or structural weaknesses exploited. Minimum 6 lines, be creative.",
    "whyItWorkedOrFailed": "2-3 paragraphs explaining exactly why the tactics succeeded or collapsed. Reference the manager's own words. Describe the key moments (e.g., '83rd minute – your deep block baited their overload...'), player movements, and tactical shifts.",
    "dramaSequence": "A thrilling, minute‑by‑minute narrative of the final 10-15 minutes of the match (from the scenario's time onward). Include specific actions (a tackle, a long ball, a substitution). End with the final score and emotional reaction."
}

IMPORTANT: 
- If the tactics are vague or poor, the outcome should be a loss or draw, but still give a detailed, entertaining explanation.
- Use formations like "3-4-2", "low block", "counter‑pressing" appropriately.
- The response MUST be pure JSON – no extra text.`;

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
                temperature: 0.9
            })
        });

        const data = await response.json();
        let aiResponse = data.choices[0].message.content;
        aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const result = JSON.parse(aiResponse);
        res.status(200).json(result);
    } catch (error) {
        console.error('AI Error:', error);
        res.status(200).json({
            rating: 5.5,
            outcome: "DRAW",
            tacticalBoard: "🔻 THE TACTICAL SETUP\nYou placed your team in a vague, undefined shape. The opponent's 4-4-2 easily passed around your non-existent press. Your defensive line held too high without cover.\n\nPlaintext\n[Opponent CM] ---> [Your exposed DM space]\nv\n[Easy through ball]",
            whyItWorkedOrFailed: "Your plan lacked specific instructions. Without clear triggers, your players hesitated. The opponent scored from a simple cross in the 85th minute. You failed to adjust to their width.",
            dramaSequence: "84' – A hopeful long ball drifts over your static backline. Their striker outmuscles your defender and slots home. 1-0 down.\n90+3' – A desperate long throw into the box is scrambled in for a scrappy equaliser. Final whistle: 1-1. A point salvaged, but the performance was unconvincing."
        });
    }
}
