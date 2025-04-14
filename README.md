# Telegram Bot with AI-powered Chat and Image Generation

## Overview
This project is a feature-rich Telegram bot built with NestJS that leverages AI technologies for natural language conversations and image generation. The bot can process messages, understand chat context, handle different types of responses, and generate images based on user prompts.

## Features
- **AI-powered Conversations**: The bot uses Google's Generative AI to provide natural language interactions
- **Context Awareness**: Maintains conversation history for contextual responses
- **Image Generation**: Generates images based on user prompts
- **Web Content Processing**: Can summarize and provide opinions on web content
- **Modular Architecture**: Built using NestJS's modular approach for maintainability and scalability

## Architecture
The project follows a clean architecture approach with clear separation of concerns:

- **Domain Layer**: Contains core business entities, models, and interfaces
- **Application Layer**: Orchestrates use cases and implements business logic
- **Infrastructure Layer**: Provides implementations for external services and repositories

## Project Structure
```
src/
├── application/       # Application layer containing handlers and services
├── domain/           # Domain models, events, and contracts
└── infrastructure/   # External service integrations (Telegram, LLM, etc.)
```

## Requirements
- Node.js 16+
- pnpm package manager
- Telegram Bot Token
- Google Generative AI API key

## Environment Variables
Create a `.env` file in the root directory with the following variables:

```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_BOT_NAME=your_bot_name
GOOGLE_API_KEY=your_google_ai_api_key
PREFERRED_LANGUAGE=Spanish
```

## Installation
```bash
# Install dependencies
$ pnpm install
```

## Running the App
```bash
# Development mode
$ pnpm run start

# Watch mode for development
$ pnpm run start:dev

# Production mode
$ pnpm run start:prod
```

## Response Handlers
The bot uses a chain of responsibility pattern to handle different types of responses:

- **GenerateImageHandler**: Processes image generation requests
- **WebContentResumeHandler**: Handles web content summary requests
- **DefaultMessageHandler**: Processes standard text responses
- **NoAnswerHandler**: Handles cases where the bot doesn't understand

## Bot Instructions
Bot instructions are configured in the `instructions.json` file, where you can customize:

- Preferred language
- Bot personality
- Response formats
- Special commands processing