# Team Invictus Playground

An interactive gaming platform featuring AI-powered Quiz and Pictionary games. Built with Angular and powered by Claude AI (Anthropic).

## Features

### 🎮 Two Game Modes

#### Quiz Game
- AI-generated multiple-choice questions on any topic
- Choose from preset themes or enter custom topics
- Timed questions with progress tracking
- Comprehensive results with answer review

#### Pictionary Guessing Game
- AI-generated SVG drawings revealed stroke by stroke
- Multiple categories: Animals, Food, Objects, Vehicles, Sports, Nature
- Scoring based on how quickly you guess
- Progressive difficulty with strategic guessing

## Technology Stack

- **Framework**: Angular 21.0.4
- **AI Provider**: Claude (Anthropic API)
- **Styling**: SCSS with modern gradients and animations
- **Deployment**: Vercel

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.4.

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## API Endpoints

The application includes two serverless API endpoints:

- `/api/generate-questions` - Generates quiz questions based on a theme
- `/api/generate-drawing` - Generates SVG drawing data for Pictionary game

Both endpoints use the Claude AI API (Anthropic) to generate content.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
