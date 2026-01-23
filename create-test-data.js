import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Creating Test Database and Table\n');

const serverProcess = spawn('node', [resolve(__dirname, 'dist/index.js')], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: process.env
});

let buffer = '';
let requestId = Date.now();

serverProcess.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (line.trim()) {
      try {
        const message = JSON.parse(line);
        if (message.id) {
          handleResponse(message);
        }
      } catch (e) {
        // Ignore non-JSON lines
      }
    }
  }
});

serverProcess.stderr.on('data', (data) => {
  console.log('[Server]', data.toString().trim());
});

const pendingRequests = new Map();
let isInitialized = false;
let databaseId = null;
let tableId = null;

function sendRequest(method, params = {}) {
  const id = ++requestId;
  const request = {
    jsonrpc: '2.0',
    id,
    method,
    params
  };

  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
  });
}

function handleResponse(message) {
  const pending = pendingRequests.get(message.id);
  if (pending) {
    pendingRequests.delete(message.id);
    if (message.error) {
      pending.reject(message.error);
    } else {
      pending.resolve(message.result);
    }
  }
}

async function main() {
  try {
    // Step 1: Initialize
    console.log('1️⃣ Initializing MCP connection...');
    await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    });
    console.log('✅ Connected\n');

    // Step 2: Create Database
    console.log('2️⃣ Creating database "Test DB"...');
    const dbResult = await sendRequest('tools/call', {
      name: 'baserow_create_database',
      arguments: {
        name: 'Test DB',
        workspace_id: 27
      }
    });
    const dbData = JSON.parse(dbResult.content[0].text);
    databaseId = dbData.id;
    console.log(`✅ Database created (ID: ${databaseId})\n`);

    // Step 3: Create Table
    console.log('3️⃣ Creating table "Test Table"...');
    const tableResult = await sendRequest('tools/call', {
      name: 'baserow_create_table',
      arguments: {
        name: 'Test Table',
        database_id: databaseId
      }
    });
    const tableData = JSON.parse(tableResult.content[0].text);
    tableId = tableData.id;
    console.log(`✅ Table created (ID: ${tableId})\n`);

    // Step 4: Get table details to see default fields
    console.log('4️⃣ Getting table structure...');
    const tableDetailsResult = await sendRequest('tools/call', {
      name: 'baserow_get_table',
      arguments: {
        table_id: tableId,
        include_fields: true
      }
    });
    const tableDetails = JSON.parse(tableDetailsResult.content[0].text);
    console.log(`✅ Table has ${tableDetails.fields.length} default field(s)\n`);
    console.log('Fields:', tableDetails.fields.map(f => `${f.name} (${f.type})`).join(', '));
    console.log('');

    // Step 5: Add rows with lorem ipsum data
    console.log('5️⃣ Adding lorem ipsum test rows...');

    const loremData = [
      'Lorem ipsum dolor sit amet',
      'Consectetur adipiscing elit',
      'Sed do eiusmod tempor',
      'Incididunt ut labore',
      'Et dolore magna aliqua'
    ];

    // Get the first field name (usually "Name" or similar)
    const firstFieldName = tableDetails.fields[0].name;

    for (let i = 0; i < loremData.length; i++) {
      const rowData = {};
      rowData[firstFieldName] = loremData[i];

      await sendRequest('tools/call', {
        name: 'baserow_create_row',
        arguments: {
          table_id: tableId,
          data: rowData
        }
      });
      console.log(`  ✓ Row ${i + 1}: ${loremData[i]}`);
    }

    console.log(`\n✅ Added ${loremData.length} rows\n`);

    // Step 6: List the rows to verify
    console.log('6️⃣ Verifying rows...');
    const rowsResult = await sendRequest('tools/call', {
      name: 'baserow_list_rows',
      arguments: {
        table_id: tableId
      }
    });
    const rowsData = JSON.parse(rowsResult.content[0].text);
    console.log(`✅ Table contains ${rowsData.results.length} rows\n`);

    console.log('🎉 Setup complete!');
    console.log(`\nDatabase: Test DB (ID: ${databaseId})`);
    console.log(`Table: Test Table (ID: ${tableId})`);
    console.log(`Rows: ${rowsData.results.length}`);
    console.log('\n💡 Note: Baserow creates tables with a default "Name" field.');
    console.log('   You can add custom fields through the Baserow web UI or API.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    serverProcess.kill();
    process.exit(0);
  }
}

// Give the server a moment to start
setTimeout(main, 1000);
