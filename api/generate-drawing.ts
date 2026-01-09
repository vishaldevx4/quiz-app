import type { VercelRequest, VercelResponse } from '@vercel/node';

interface Stroke {
  path: string;
  strokeWidth: number;
  color: string;
}

interface Drawing {
  word: string;
  category: string;
  strokes: Stroke[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { category } = req.body;

  if (!category) {
    return res.status(400).json({ error: 'Category is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  // Add timestamp and random element to ensure unique generations
  const timestamp = Date.now();
  const randomSeed = Math.floor(Math.random() * 10000);
  
  const prompt = `Generate a UNIQUE and RANDOM drawing for a Pictionary-style guessing game. 
IMPORTANT: Make this drawing completely different from previous drawings. Session ID: ${timestamp}-${randomSeed}

Category: "${category}"

Pick a RANDOM word from the ${category} category. Choose from a diverse range of options within this category.
Break down the drawing into 8-12 individual SVG path strokes that progressively reveal the object.

CRITICAL REQUIREMENTS FOR VARIETY:
- Select a DIFFERENT word each time - don't repeat common choices
- Vary the complexity and style of the drawing
- Use different arrangements and compositions
- Make strokes reveal the object in an interesting order

Return ONLY valid JSON with this exact format, no other text:
{
  "word": "chosen word here",
  "category": "${category}",
  "difficulty": "easy",
  "strokes": [
    {
      "path": "M 50 50 L 150 50 L 150 150 L 50 150 Z",
      "strokeWidth": 3,
      "color": "#000000"
    }
  ]
}

Technical Rules:
- Use SVG path commands (M=move, L=line, C=curve, Q=quadratic, C=cubic, A=arc, Z=close)
- Coordinates must be within 0-400 range (viewBox is "0 0 400 400")
- Use 8-12 strokes that progressively build up the drawing
- First strokes: basic shapes/outlines, later strokes: details and features
- strokeWidth: 2-5
- color: #000000 (black)
- Center the drawing around 200,200
- Difficulty: "easy" (common), "medium" (recognizable), or "hard" (abstract)

Examples of word variety by category:
- Animals: elephant, butterfly, penguin, octopus, giraffe, dolphin, owl, kangaroo
- Food: pizza, banana, cupcake, sushi, taco, watermelon, burger, ice cream
- Objects: lamp, umbrella, scissors, key, phone, camera, guitar, watch
- Vehicles: airplane, bicycle, boat, train, helicopter, rocket, submarine, skateboard
- Sports: basketball, tennis, soccer, swimming, skiing, archery, golf, bowling
- Nature: tree, flower, mountain, cloud, rainbow, river, volcano, sunset

Pick a word that hasn't been commonly used and create a distinctive drawing!`;

  try {
    console.log(`Generating drawing for category: ${category}, seed: ${randomSeed}`);
    
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
        temperature: 1.0, // Maximum creativity for variety
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
      return res.status(response.status).json({ error: 'Failed to generate drawing' });
    }

    const data = await response.json();
    const content = data.content[0].text;
    console.log('AI Response received, extracting drawing...');

    // Extract JSON object from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const drawing: Drawing = JSON.parse(jsonMatch[0]);
      
      // Validate the drawing has required fields
      if (!drawing.word || !drawing.strokes || drawing.strokes.length === 0) {
        console.error('Invalid drawing structure:', drawing);
        return res.status(500).json({ error: 'Invalid drawing data from AI' });
      }
      
      console.log(`Successfully generated drawing: "${drawing.word}" with ${drawing.strokes.length} strokes`);
      return res.status(200).json(drawing);
    }

    console.error('Failed to extract JSON from AI response');
    return res.status(500).json({ error: 'Invalid response format from AI' });
  } catch (error) {
    console.error('Error generating drawing:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

