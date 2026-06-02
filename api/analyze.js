export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { scenario, tactics, managerLevel } = req.body;

    if (!tactics) {
        return res.status(400).json({ error: 'No tactics provided' });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    let scenarioContext = "";
    if (scenario === 'World Cup') {
        scenarioContext = `WORLD CUP FINAL: It's the 90th minute, 1-1. Argentina has possession. Messi just nutmegged your midfielder. Your players are exhausted. The whole world is watching. This is the biggest moment of your managerial career.`;
    } else if (scenario === 'Manager Career') {
        scenarioContext = `RELEGATION DECIDER: 85th minute, losing 1-0 to your biggest rivals. Your team looks defeated. The fans are silent. The owner is watching from the stands. If you lose, you're relegated. If you're relegated, you're probably fired.`;
    } else {
        scenarioContext = `CHAOS MODE: 80th minute, 2-0 down, playing with 10 men after a red card. The opposition is mocking your team. The kit man is already packing the bags. Absolute disaster scenario.`;
    }

    const prompt = `You are a brutally honest, hilarious, and highly knowledgeable football tactical analyst. Think Jose Mourinho + Gordon Ramsay + a disappointed kit man.

SCENARIO: ${scenarioContext}
MANAGER LEVEL: ${managerLevel} (higher level means they should know better)

MANAGER'S TACTICAL PLAN:
"${tactics}"

Respond with ONLY valid JSON in this exact format. Make your responses DETAILED and SPICY:

{
    "rating": 7.5,
    "narrative": "A 3-4 sentence dramatic description of how the match played out based on their tactics. Use football terminology. Be vivid.",
    "strengths": "2-3 bullet points (use • symbols) of what they actually did well. If they did nothing well, say that honestly.",
    "weaknesses": "2-3 bullet points (use • symbols) of their tactical failures. Be specific and harsh if needed.",
    "roast": "One absolutely devastating roast line. Examples: 'The kit man could have set up a better defensive shape with the laundry cart.' OR 'Your tactics made my grandmother's bingo strategy look like prime Guardiola.' OR 'I've seen better organization at a youth team snack bar.'"
}

Rating guide:
1-3: Absolutely terrible. This manager has no idea what they're doing.
4-5: Poor. Fundamental misunderstandings.
6-7: Average. Some good ideas but major flaws.
8-9: Very good. Smart adjustments, clear thinking.
10: World class. Perfect tactical execution.

Be entertaining but also educational. The manager wants to improve.`;

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
                temperature: 0.9
            })
        });

        const data = await response.json();
        
        if (!data.choices || !data.choices[0]) {
            throw new Error('Invalid AI response');
        }
        
        let aiResponse = data.choices[0].message.content;
        aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const result = JSON.parse(aiResponse);
        
        res.status(200).json(result);
    } catch (error) {
        console.error('AI Error:', error);
        res.status(200).json({
            rating: 6.0,
            narrative: "The AI is having a moment. Your tactics were... interesting. Let's just say the kit man has opinions.",
            strengths: "• You showed up\n• You submitted something\n• That's technically effort",
            weaknesses: "• Your plan lacked specificity\n• The AI couldn't process it properly\n• Try being more detailed next time",
            roast: "The AI crashed trying to understand your tactics. That's a new low."
        });
    }
}
