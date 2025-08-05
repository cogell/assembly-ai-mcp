# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AssemblyAI MCP (Model Context Protocol) Server that provides audio transcription capabilities through the MCP framework. The server exposes AssemblyAI's transcription API as MCP tools and resources, enabling AI assistants to transcribe audio files and manage transcription jobs.

## Development Commands

### Build and Start
- `npm run build` - Compile TypeScript to JavaScript in `dist/` directory
- `npm start` - Run the compiled server (requires build first)
- `npm run dev` - Build and run the server in one command
- `npm run watch` - Build in watch mode with automatic recompilation

### Testing
- `node test.js` - Run the basic MCP server test script (requires built server)

## Architecture

The server is implemented as a single TypeScript file (`src/index.ts`) that:

1. **MCP Server Setup**: Uses `@modelcontextprotocol/sdk` with stdio transport
2. **AssemblyAI Integration**: Direct integration with the `assemblyai` npm package
3. **Input Validation**: Uses Zod schemas for type-safe parameter validation
4. **Error Handling**: Comprehensive error handling with user-friendly messages

### MCP Tools Provided
- `transcribe_url` - Transcribe audio from remote URL (synchronous)
- `transcribe_file` - Transcribe audio from local file path (synchronous)  
- `submit_transcription` - Submit transcription job asynchronously
- `get_transcript` - Retrieve transcription status and results by ID

### MCP Resources
- `transcript://{id}` - Access transcript data directly by ID as JSON

## Configuration Requirements

- **Required**: `ASSEMBLYAI_API_KEY` environment variable
- Server will fail to start without this API key
- Can be set via environment variable or `.env` file

## Key Dependencies

- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `assemblyai` - Official AssemblyAI SDK
- `zod` - Runtime type validation
- TypeScript with Node.js 18+ target

## Code Patterns

- All tool handlers use try/catch with structured error responses
- Zod schemas validate inputs before processing
- Tools return structured `{ content, isError }` responses
- Resources return JSON-formatted transcript data
- Graceful shutdown handling for SIGINT/SIGTERM