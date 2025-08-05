#!/usr/bin/env node

/**
 * Simple test script for the AssemblyAI MCP Server
 * Run with: node test.js
 */

const { spawn } = require('child_process');
const path = require('path');

// Test message to send to the MCP server
const testMessage = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/list",
  params: {}
};

console.log('🧪 Testing AssemblyAI MCP Server...\n');

// Start the server process
const serverPath = path.join(__dirname, 'dist', 'index.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: { ...process.env }
});

// Send test message
server.stdin.write(JSON.stringify(testMessage) + '\n');

// Handle server output
let output = '';
server.stdout.on('data', (data) => {
  output += data.toString();
  
  // Try to parse JSON response
  try {
    const lines = output.split('\n').filter(line => line.trim());
    for (const line of lines) {
      if (line.startsWith('{')) {
        const response = JSON.parse(line);
        console.log('✅ Server Response:');
        console.log(JSON.stringify(response, null, 2));
        
        if (response.result && response.result.tools) {
          console.log('\n🛠️  Available Tools:');
          response.result.tools.forEach(tool => {
            console.log(`  - ${tool.name}: ${tool.description}`);
          });
        }
        
        // Exit after getting response
        setTimeout(() => {
          server.kill();
          console.log('\n✅ Test completed successfully!');
          process.exit(0);
        }, 100);
      }
    }
  } catch (e) {
    // Ignore JSON parse errors, keep collecting output
  }
});

// Handle server exit
server.on('close', (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`);
    process.exit(1);
  }
});

// Handle errors
server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Test timed out');
  server.kill();
  process.exit(1);
}, 10000);