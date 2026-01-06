import type { VercelRequest, VercelResponse } from '@vercel/node';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { theme } = req.body;

  if (!theme) {
    return res.status(400).json({ error: 'Theme is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const prompt = `Generate 10 multiple choice quiz questions about ${theme}.
Each question should have exactly 4 options.
Return ONLY a valid JSON array with this exact format, no other text:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  }
]
The correctAnswer is the index (0-3) of the correct option.
Make the questions interesting and varied in difficulty.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
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
      return res.status(response.status).json({ error: 'Failed to generate questions' });
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const questions: Question[] = JSON.parse(jsonMatch[0]);
      return res.status(200).json(questions);
    }

    return res.status(500).json({ error: 'Invalid response format from AI' });
  } catch (error) {
    console.error('Error generating questions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
