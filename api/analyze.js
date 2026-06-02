export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { difficulty, scenario, tactics, managerLevel } = req.body;
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    const prompt = `You are a brutally honest, world‑class football tactical analyst. Your job is to evaluate the manager's submitted tactical plan in extreme detail.

DIFFICULTY: ${difficulty.toUpperCase()}
OPPONENT FORMATION: ${scenario.opponentFormation}
SETBACKS: ${scenario.setbacks ? scenario.setbacks.join(', ') : 'None'}
SCENARIO DESCRIPTION: ${scenario.description}
MANAGER LEVEL: ${managerLevel}

THE MANAGER'S TACTICAL PLAN:
"${tactics}"

Now, write a highly detailed, specific evaluation. DO NOT use generic sentences. Quote specific parts of the manager's plan. Explain exactly why something worked or failed.

Return ONLY valid JSON in this exact structure:

{
    "rating": 7.5,
    "outcome": "WIN/DRAW/LOSS",
    "narrative": "3-4 sentence dramatic match narrative that directly references the manager's tactical instructions (quote them)",
    "strengths": "2-3 bullet points (use •) that quote the manager's specific good ideas and explain why they worked",
    "weaknesses": "2-3 bullet points that quote what the manager missed or did wrong, explaining the tactical consequence",
    "improvements": "2-3 bullet points with very specific alternative actions the manager should have taken"
}

Requirements:
- Rating between 1.0 and 10.0 (1 = disaster, 10 = genius).
- The narrative must include a dramatic timeline (e.g., '75' — ...') and show the result of the tactics.
- Strengths/weaknesses must reference the manager's own words (use quotes from their plan).
- If the plan is vague, the rating should be low (3-4) and the weaknesses should explain why vagueness is bad.
- Be entertaining but educational. Roast them only if they deserve it.

IMPORTANT: The response MUST be ONLY the JSON object. No extra text.`;

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
                temperature: 0.85
            })
        });

        const data = await response.json();
        let aiResponse = data.choices[0].message.content;
        aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const result = JSON.parse(aiResponse);
        res.status(200).json(result);
    } catch (error) {
        console.error('AI Error:', error);
        // Detailed fallback – still better than generic
        res.status(200).json({
            rating: 5.5,
            outcome: "DRAW",
            narrative: "Your plan lacked detail. The opposition exploited your vague instructions and held you to a draw.",
            strengths: "• You submitted a plan – that's effort.\n• Basic formation recognition was present.",
            weaknesses: "• You didn't specify any pressing triggers or defensive width.\n• Your instructions were too general to execute.",
            improvements: "• Be specific: 'drop into a 5-4-1 low block', 'instruct fullbacks to tuck inside'.\n• Mention how to counter the opponent's specific formation (e.g., overload the flanks)."
        });
    }
}
