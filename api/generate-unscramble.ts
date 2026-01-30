import type { VercelRequest, VercelResponse } from '@vercel/node';

interface UnscrambleWord {
  originalWord: string;
  scrambledWord: string;
  category: string;
  difficulty: string;
  basePoints: number;
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

  // Base points based on difficulty
  const pointsMap: { [key: string]: number } = {
    easy: 50,
    medium: 100,
    hard: 150
  };

  const basePoints = pointsMap[difficulty] || 50;

  // Word length based on difficulty
  const lengthMap: { [key: string]: string } = {
    easy: '5-7 letters',
    medium: '8-10 letters',
    hard: '11-15 letters'
  };

  const wordLength = lengthMap[difficulty] || '5-7 letters';
  const timestamp = Date.now();
  const randomSeed = Math.floor(Math.random() * 10000);

  const prompt = `Generate 10 UNIQUE words for a word unscramble game.
Session ID: ${timestamp}-${randomSeed}

Category: "${category}"
Difficulty: ${difficulty}
Word length: ${wordLength}

IMPORTANT REQUIREMENTS:
- Generate exactly 10 unique words that fit the category
- Each word should be ${wordLength} long
- Words should be common enough to be recognizable but challenging to unscramble
- For each word, provide the original word and a scrambled version
- The scrambled version should be a random rearrangement of the letters
- Ensure the scrambled version is different from the original
- Words should be appropriate for all ages
- Use proper nouns (names, places, brands) where appropriate for the category

Return ONLY valid JSON with this exact format:
[
  {
    "originalWord": "Marvel",
    "scrambledWord": "Velmra",
    "category": "${category}",
    "difficulty": "${difficulty}",
    "basePoints": ${basePoints}
  }
]

Guidelines by difficulty:
- Easy (${wordLength}): Common, everyday words that most people know
- Medium (${wordLength}): Moderately challenging words, may include proper nouns
- Hard (${wordLength}): Complex, longer words that require more thought

Make the words fun, engaging, and appropriate for the "${category}" category!`;

  try {
    console.log(`Generating unscramble words: category=${category}, difficulty=${difficulty}, seed=${randomSeed}`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
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
        error: 'Failed to generate words',
        apiLimitReached: true
      });
    }

    const data = await response.json();
    const content = data.content[0].text;
    console.log('AI Response received, extracting words...');

    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const words: UnscrambleWord[] = JSON.parse(jsonMatch[0]);

      // Validate words
      if (!Array.isArray(words) || words.length !== 10) {
        console.error('Invalid number of words:', words.length);
        return res.status(500).json({
          error: 'Invalid number of words from AI',
          apiLimitReached: true
        });
      }

      // Validate each word
      for (const w of words) {
        if (!w.originalWord || !w.scrambledWord || !w.category || !w.difficulty || typeof w.basePoints !== 'number') {
          console.error('Invalid word structure:', w);
          return res.status(500).json({
            error: 'Invalid word structure from AI',
            apiLimitReached: true
          });
        }
        // Ensure scrambled is different from original
        if (w.originalWord.toLowerCase() === w.scrambledWord.toLowerCase()) {
          console.error('Scrambled word identical to original:', w);
          return res.status(500).json({
            error: 'Scrambled word identical to original',
            apiLimitReached: true
          });
        }
      }

      console.log(`Successfully generated ${words.length} words`);
      return res.status(200).json(words);
    }

    console.error('Failed to extract JSON from AI response');
    return res.status(500).json({
      error: 'Invalid response format from AI',
      apiLimitReached: true
    });
  } catch (error) {
    console.error('Error generating words:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      apiLimitReached: true
    });
  }
}
