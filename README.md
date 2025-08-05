# AssemblyAI MCP Server

A Model Context Protocol (MCP) server that provides access to AssemblyAI's transcription services. This server enables AI assistants to transcribe audio files and manage transcription jobs through a standardized interface.

## Vibe Code Spectrum

On a scale of 1 to 10, 10 being the most vibey, this is a 9.

## Features

- **Audio transcription** from URLs and local files
- **Asynchronous job submission** for large files
- **Transcript retrieval** and status checking
- **Resource access** to transcript data
- **Type-safe** implementation with Zod validation
- **Error handling** and graceful shutdown

## Installation

1. Clone or create this project directory
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your AssemblyAI API key (see Configuration section)
4. Build the TypeScript code:
   ```bash
   npm run build
   ```

## Configuration

You need an AssemblyAI API key to use this server. Get one from [AssemblyAI](https://www.assemblyai.com/).

Set the environment variable:

```bash
export ASSEMBLYAI_API_KEY="your-api-key-here"
```

Or create a `.env` file:

```
ASSEMBLYAI_API_KEY=your-api-key-here
```

## Usage

### Running the Server

Start the MCP server:

```bash
npm start
```

For development with auto-rebuild:

```bash
npm run watch
```

### MCP Tools

The server provides the following tools:

#### `transcribe_url`

Transcribe audio from a remote URL and wait for completion.

**Parameters:**

- `audioUrl` (string, required): URL of the audio file
- `options` (object, optional): Transcription options
  - `speaker_labels` (boolean): Enable speaker diarization
  - `language_code` (string): Specify language (e.g., "en")
  - `punctuate` (boolean): Add punctuation
  - `format_text` (boolean): Format text for readability

**Example:**

```json
{
  "audioUrl": "https://example.com/audio.mp3",
  "options": {
    "speaker_labels": true,
    "punctuate": true
  }
}
```

#### `transcribe_file`

Transcribe audio from a local file path and wait for completion.

**Parameters:**

- `filePath` (string, required): Local path to the audio file
- `options` (object, optional): Same as `transcribe_url`

**Example:**

```json
{
  "filePath": "/path/to/audio.wav",
  "options": {
    "language_code": "en"
  }
}
```

#### `submit_transcription`

Submit audio for transcription without waiting for completion. Returns immediately with a job ID.

**Parameters:**

- `audio` (string, required): URL or local file path
- `options` (object, optional): Same transcription options

**Example:**

```json
{
  "audio": "https://example.com/large-audio.mp3",
  "options": {
    "speaker_labels": true
  }
}
```

#### `get_transcript`

Retrieve the status and results of a transcription job.

**Parameters:**

- `transcriptId` (string, required): The transcript ID returned from previous calls

**Example:**

```json
{
  "transcriptId": "1234567890"
}
```

### MCP Resources

#### `transcript://{id}`

Access transcript data directly by ID. Provides structured JSON with all transcript information.

**Example URI:** `transcript://1234567890`

**Returns:**

```json
{
  "id": "1234567890",
  "status": "completed",
  "text": "Hello, this is a test transcription...",
  "confidence": 0.95,
  "words": [...],
  "utterances": [...],
  "created": "2024-01-01T00:00:00Z",
  "completed": "2024-01-01T00:01:30Z"
}
```

## Integration Examples

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "assemblyai": {
      "command": "node",
      "args": ["/path/to/assemblyai-mcp-server/dist/index.js"],
      "env": {
        "ASSEMBLYAI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### With Other MCP Clients

The server uses stdio transport, so it's compatible with any MCP client that supports this transport method.

## Workflow Examples

### Quick Transcription

1. Use `transcribe_url` or `transcribe_file` for immediate results
2. The tool waits for completion and returns the full transcript

### Async Processing

1. Use `submit_transcription` for large files
2. Use `get_transcript` to check status and retrieve results
3. Use the `transcript://` resource for structured data access

### Speaker Identification

```json
{
  "audioUrl": "https://example.com/meeting.mp3",
  "options": {
    "speaker_labels": true,
    "punctuate": true,
    "format_text": true
  }
}
```

## Error Handling

The server provides detailed error messages for common issues:

- **Missing API key**: Server won't start without `ASSEMBLYAI_API_KEY`
- **Invalid audio URLs**: Clear error messages for inaccessible files
- **File not found**: Helpful messages for local file issues
- **API errors**: AssemblyAI error messages passed through
- **Invalid transcript IDs**: Clear feedback for non-existent transcripts

## Development

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Watch Mode

```bash
npm run watch
```

## Requirements

- Node.js 18.0.0 or higher
- AssemblyAI API key
- MCP-compatible client

## License

MIT License

## Support

For AssemblyAI API issues, visit [AssemblyAI Documentation](https://www.assemblyai.com/docs).
For MCP protocol questions, see [Model Context Protocol](https://modelcontextprotocol.io).
