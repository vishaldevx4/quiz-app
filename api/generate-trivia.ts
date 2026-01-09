import type { VercelRequest, VercelResponse } from '@vercel/node';

interface TriviaQuestion {
  question: string;
  correctAnswer: string;
  incorrectAnswers: string[];
  explanation?: string;
  points: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { category, difficulty } = req.body;

  if (!category || !difficulty) {
    return res.status(400).json({ error: 'Category and difficulty are required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  // Points based on difficulty
  const pointsMap: { [key: string]: number } = {
    simple: 100,
    medium: 200,
    hard: 300
  };

  const points = pointsMap[difficulty] || 100;
  const timestamp = Date.now();
  const randomSeed = Math.floor(Math.random() * 10000);

  const prompt = `Generate 6 UNIQUE and VARIED riddles for a riddle-guessing game.
Session ID: ${timestamp}-${randomSeed}

Category: "${category}"
Difficulty: ${difficulty}

IMPORTANT REQUIREMENTS:
- Generate exactly 6 creative riddles
- Each riddle should be thought-provoking and fun
- Provide 1 correct answer and 3 plausible incorrect answers for each
- Riddles should be ${difficulty} difficulty
- Include a brief explanation for why the answer is correct (1-2 sentences)
- Make riddles diverse and interesting within the category
- Use straightforward riddles for simple difficulty
- Use clever wordplay and lateral thinking for hard difficulty

Return ONLY valid JSON with this exact format:
[
  {
    "question": "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
    "correctAnswer": "An Echo",
    "incorrectAnswers": ["A Ghost", "The Wind", "A Radio"],
    "explanation": "An echo is a sound that reflects off surfaces and repeats back to you.",
    "points": ${points}
  }
]

Guidelines by difficulty:
- Simple: Easy riddles with obvious clues, suitable for all ages
- Medium: Requires some thinking, moderate wordplay
- Hard: Complex riddles, clever wordplay, lateral thinking required

Make the riddles creative and mind-bending!`;

  try {
    console.log(`Generating riddles: category=${category}, difficulty=${difficulty}, seed=${randomSeed}`);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        temperature: 0.9,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Claude API error:', error);
      return res.status(response.status).json({ 
        error: 'Failed to generate riddles',
        apiLimitReached: true 
      });
    }

    const data = await response.json();
    const content = data.content[0].text;
    console.log('AI Response received, extracting riddles...');

    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const questions: TriviaQuestion[] = JSON.parse(jsonMatch[0]);
      
      // Validate questions
      if (!Array.isArray(questions) || questions.length !== 6) {
        console.error('Invalid number of riddles:', questions.length);
        return res.status(500).json({ 
          error: 'Invalid number of riddles from AI',
          apiLimitReached: true 
        });
      }

      // Validate each riddle
      for (const q of questions) {
        if (!q.question || !q.correctAnswer || !q.incorrectAnswers || q.incorrectAnswers.length !== 3) {
          console.error('Invalid riddle structure:', q);
          return res.status(500).json({ 
            error: 'Invalid riddle structure from AI',
            apiLimitReached: true 
          });
        }
      }
      
      console.log(`Successfully generated ${questions.length} riddles`);
      return res.status(200).json(questions);
    }

    console.error('Failed to extract JSON from AI response');
    return res.status(500).json({ 
      error: 'Invalid response format from AI',
      apiLimitReached: true 
    });
  } catch (error) {
    console.error('Error generating riddles:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      apiLimitReached: true
    });
  }
}

