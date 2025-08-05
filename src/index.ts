import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { AssemblyAI } from "assemblyai";
import { z } from "zod";

// Initialize AssemblyAI client
const apiKey = process.env.ASSEMBLYAI_API_KEY;
if (!apiKey) {
  console.error("ASSEMBLYAI_API_KEY environment variable is required");
  process.exit(1);
}

const assemblyai = new AssemblyAI({ apiKey });

// Create MCP server
const server = new McpServer({
  name: "assemblyai-mcp-server",
  version: "1.0.0"
});

// Zod schemas for input validation
const TranscriptionOptionsSchema = z.object({
  speaker_labels: z.boolean().optional(),
  language_code: z.string().optional(),
  punctuate: z.boolean().optional(),
  format_text: z.boolean().optional()
}).optional();

// Transcript resource - provides access to transcript content by ID
server.registerResource(
  "transcript",
  new ResourceTemplate("transcript://{id}", { list: undefined }),
  {
    title: "Transcript Resource",
    description: "Access AssemblyAI transcript content by ID",
    mimeType: "application/json"
  },
  async (uri, { id }) => {
    try {
      const transcript = await assemblyai.transcripts.get(id as string);
      
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify({
            id: transcript.id,
            status: transcript.status,
            text: transcript.text,
            audio_url: transcript.audio_url,
            confidence: transcript.confidence,
            words: transcript.words,
            utterances: transcript.utterances
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to get transcript ${id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

// Tool: Transcribe from URL
server.registerTool(
  "transcribe_url",
  {
    title: "Transcribe Audio from URL",
    description: "Transcribe audio from a remote URL using AssemblyAI",
    inputSchema: {
      audioUrl: z.string().url().describe("The URL of the audio file to transcribe"),
      options: TranscriptionOptionsSchema.describe("Optional transcription settings")
    }
  },
  async ({ audioUrl, options = {} }) => {
    try {
      const transcript = await assemblyai.transcripts.transcribe({
        audio: audioUrl,
        ...options
      });
      
      return {
        content: [{
          type: "text",
          text: `Transcription completed successfully!\n\nTranscript ID: ${transcript.id}\nStatus: ${transcript.status}\nText: ${transcript.text || 'No text available'}\n\nConfidence: ${transcript.confidence || 'N/A'}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error transcribing audio: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

// Tool: Transcribe from local file
server.registerTool(
  "transcribe_file",
  {
    title: "Transcribe Local Audio File",
    description: "Transcribe audio from a local file path using AssemblyAI",
    inputSchema: {
      filePath: z.string().describe("The local file path of the audio file to transcribe"),
      options: TranscriptionOptionsSchema.describe("Optional transcription settings")
    }
  },
  async ({ filePath, options = {} }) => {
    try {
      const transcript = await assemblyai.transcripts.transcribe({
        audio: filePath,
        ...options
      });
      
      return {
        content: [{
          type: "text",
          text: `Transcription completed successfully!\n\nTranscript ID: ${transcript.id}\nStatus: ${transcript.status}\nText: ${transcript.text || 'No text available'}\n\nConfidence: ${transcript.confidence || 'N/A'}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error transcribing file: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

// Tool: Submit transcription (async, returns immediately)
server.registerTool(
  "submit_transcription",
  {
    title: "Submit Audio for Transcription",
    description: "Submit audio for transcription without waiting for completion",
    inputSchema: {
      audio: z.string().describe("The URL or local file path of the audio to transcribe"),
      options: TranscriptionOptionsSchema.describe("Optional transcription settings")
    }
  },
  async ({ audio, options = {} }) => {
    try {
      const transcript = await assemblyai.transcripts.submit({
        audio,
        ...options
      });
      
      return {
        content: [{
          type: "text",
          text: `Transcription job submitted successfully!\n\nTranscript ID: ${transcript.id}\nStatus: ${transcript.status}\n\nUse the get_transcript tool with ID ${transcript.id} to check progress and get results.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error submitting transcription: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

// Tool: Get transcript by ID
server.registerTool(
  "get_transcript",
  {
    title: "Get Transcript by ID",
    description: "Retrieve transcription results by transcript ID",
    inputSchema: {
      transcriptId: z.string().describe("The transcript ID to retrieve")
    }
  },
  async ({ transcriptId }) => {
    try {
      const transcript = await assemblyai.transcripts.get(transcriptId);
      
      let statusMessage = '';
      switch (transcript.status) {
        case 'completed':
          statusMessage = 'Transcription completed successfully!';
          break;
        case 'processing':
          statusMessage = 'Transcription is still processing...';
          break;
        case 'queued':
          statusMessage = 'Transcription is queued for processing...';
          break;
        case 'error':
          statusMessage = `Transcription failed: ${transcript.error || 'Unknown error'}`;
          break;
        default:
          statusMessage = `Status: ${transcript.status}`;
      }
      
      return {
        content: [{
          type: "text",
          text: `${statusMessage}\n\nTranscript ID: ${transcript.id}\nStatus: ${transcript.status}\nText: ${transcript.text || 'No text available yet'}\nConfidence: ${transcript.confidence || 'N/A'}\nAudio URL: ${transcript.audio_url || 'N/A'}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error retrieving transcript: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

// Connect to stdio transport and start the server
async function main() {
  const transport = new StdioServerTransport();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.error('Received SIGINT, shutting down gracefully...');
    await transport.close();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.error('Received SIGTERM, shutting down gracefully...');
    await transport.close();
    process.exit(0);
  });
  
  try {
    await server.connect(transport);
    console.error('AssemblyAI MCP Server started successfully');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});