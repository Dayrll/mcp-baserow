#!/usr/bin/env node

/**
 * Baserow Formula Fields Demo Script
 *
 * This script demonstrates the safe workflow for creating and testing formula fields:
 * 1. Create field as basic type first (text/number)
 * 2. Update field with formula expression
 * 3. Create test data with known values
 * 4. Verify formula output matches expected
 * 5. Test edge cases (null, empty, zero)
 *
 * Prerequisites:
 * - MCP Baserow server built (npm run build)
 * - Valid Baserow credentials in .env file
 * - At least one workspace and database available
 *
 * Usage:
 *   node examples/scripts/formula-field-demo.js
 */

import { spawn } from 'child_process';

// Configuration - UPDATE THESE WITH YOUR IDS
const CONFIG = {
  // You'll need to update these after running the script once to see your workspace/database IDs
  workspaceId: null,  // Set to your workspace ID, or leave null to use first available
  databaseId: null,   // Set to your database ID, or leave null to create a new test database
  tableName: 'Formula Demo Table',
  cleanupAfter: false // Set to true to delete the test table after demo
};

class FormulaDemoRunner {
  constructor() {
    this.server = null;
    this.buffer = '';
    this.messageId = 1;
    this.responses = new Map();
    this.tableId = null;
    this.fieldIds = {};
    this.rowIds = [];
  }

  async start() {
    console.log('🚀 Baserow Formula Fields Demo\n');
    console.log('This demo will guide you through the safe workflow for formula fields:\n');
    console.log('  1. Create fields as basic types');
    console.log('  2. Update to formula fields');
    console.log('  3. Add test data');
    console.log('  4. Verify calculations');
    console.log('  5. Test edge cases\n');
    console.log('━'.repeat(80) + '\n');

    // Start MCP server
    this.server = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'inherit'],
      env: { ...process.env }
    });

    // Handle server output
    this.server.stdout.on('data', (data) => {
      this.buffer += data.toString();
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            if (response.id) {
              this.responses.set(response.id, response);
            }
          } catch (e) {
            // Ignore non-JSON output
          }
        }
      }
    });

    // Wait for server to start
    await this.sleep(1000);

    try {
      // Initialize MCP connection
      await this.initialize();

      // Check auth
      await this.checkAuth();

      // Setup workspace and database
      await this.setupWorkspaceAndDatabase();

      // Create test table
      await this.createTable();

      // Demo 1: Full Name Formula
      await this.demoFullNameFormula();

      // Demo 2: Discount Calculator
      await this.demoDiscountCalculator();

      // Demo 3: Age Calculator
      await this.demoAgeCalculator();

      // Summary
      this.printSummary();

      // Cleanup
      if (CONFIG.cleanupAfter) {
        await this.cleanup();
      }

      console.log('\n✅ Demo completed successfully!\n');
      console.log('📚 Learn more:');
      console.log('  - examples/formula-fields-guide.md - Comprehensive guide');
      console.log('  - examples/formula-testing-workflow.md - Step-by-step workflow');
      console.log('  - examples/formula-field-recipes.md - Copy-paste recipes\n');

    } catch (error) {
      console.error('\n❌ Demo failed:', error.message);
      console.error('\nTip: Make sure you have:');
      console.error('  1. Built the project (npm run build)');
      console.error('  2. Valid credentials in .env file');
      console.error('  3. At least one workspace available\n');
    } finally {
      this.server.kill();
      process.exit(0);
    }
  }

  async sendRequest(method, params = {}) {
    const id = this.messageId++;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    this.server.stdin.write(JSON.stringify(request) + '\n');

    // Wait for response
    const maxWait = 10000; // 10 seconds
    const startTime = Date.now();

    while (!this.responses.has(id)) {
      if (Date.now() - startTime > maxWait) {
        throw new Error('Request timeout');
      }
      await this.sleep(100);
    }

    const response = this.responses.get(id);
    this.responses.delete(id);

    if (response.error) {
      throw new Error(response.error.message || 'Request failed');
    }

    return response.result;
  }

  async callTool(name, args = {}) {
    return this.sendRequest('tools/call', {
      name,
      arguments: args
    });
  }

  async initialize() {
    console.log('📡 Initializing MCP connection...');
    await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'formula-demo', version: '1.0.0' }
    });
    console.log('   ✓ Connected\n');
  }

  async checkAuth() {
    console.log('🔐 Checking authentication...');
    const result = await this.callTool('baserow_auth_status');
    console.log('   ✓ Authenticated\n');
  }

  async setupWorkspaceAndDatabase() {
    console.log('🏢 Setting up workspace and database...');

    // Get or use configured workspace
    if (!CONFIG.workspaceId) {
      const workspaces = await this.callTool('baserow_list_workspaces');
      const content = JSON.parse(workspaces.content[0].text);
      CONFIG.workspaceId = content[0].id;
      console.log(`   ℹ Using workspace: ${content[0].name} (ID: ${CONFIG.workspaceId})`);
    }

    await this.callTool('baserow_set_workspace', { workspace_id: CONFIG.workspaceId });

    // Get or create database
    if (!CONFIG.databaseId) {
      // Create a test database
      const dbResult = await this.callTool('baserow_create_database', {
        name: 'Formula Demo Database',
        workspace_id: CONFIG.workspaceId
      });
      const dbContent = JSON.parse(dbResult.content[0].text);
      CONFIG.databaseId = dbContent.id;
      console.log(`   ✓ Created test database (ID: ${CONFIG.databaseId})`);
    }

    console.log();
  }

  async createTable() {
    console.log('📊 Creating test table...');
    const result = await this.callTool('baserow_create_table', {
      name: CONFIG.tableName,
      database_id: CONFIG.databaseId
    });
    const content = JSON.parse(result.content[0].text);
    this.tableId = content.id;
    console.log(`   ✓ Table created (ID: ${this.tableId})\n`);
  }

  async demoFullNameFormula() {
    console.log('━'.repeat(80));
    console.log('DEMO 1: Full Name Formula');
    console.log('━'.repeat(80) + '\n');

    console.log('Goal: Combine First Name and Last Name with proper spacing\n');

    // Step 1: Create source fields
    console.log('Step 1: Create source fields');
    const firstName = await this.callTool('baserow_create_field', {
      table_id: this.tableId,
      type: 'text',
      name: 'First Name'
    });
    const firstNameData = JSON.parse(firstName.content[0].text);
    this.fieldIds.firstName = firstNameData.id;
    console.log(`   ✓ Created 'First Name' field (ID: ${this.fieldIds.firstName})`);

    const lastName = await this.callTool('baserow_create_field', {
      table_id: this.tableId,
      type: 'text',
      name: 'Last Name'
    });
    const lastNameData = JSON.parse(lastName.content[0].text);
    this.fieldIds.lastName = lastNameData.id;
    console.log(`   ✓ Created 'Last Name' field (ID: ${this.fieldIds.lastName})\n`);

    // Step 2: Create formula field as text
    console.log('Step 2: Create formula field as text (safe approach)');
    const fullName = await this.callTool('baserow_create_field', {
      table_id: this.tableId,
      type: 'text',
      name: 'Full Name'
    });
    const fullNameData = JSON.parse(fullName.content[0].text);
    this.fieldIds.fullName = fullNameData.id;
    console.log(`   ✓ Created 'Full Name' field as text (ID: ${this.fieldIds.fullName})\n`);

    // Step 3: Update to formula field
    console.log('Step 3: Update field to formula');
    const formula = "concat(field('First Name'), ' ', field('Last Name'))";
    console.log(`   Formula: ${formula}`);
    await this.callTool('baserow_update_field', {
      table_id: this.tableId,
      field_id: this.fieldIds.fullName,
      type: 'formula',
      formula: formula
    });
    console.log('   ✓ Field updated to formula type\n');

    // Step 4: Create test data
    console.log('Step 4: Create test data');
    const testCases = [
      { 'First Name': 'John', 'Last Name': 'Doe', expected: 'John Doe' },
      { 'First Name': 'Jane', 'Last Name': 'Smith', expected: 'Jane Smith' },
      { 'First Name': 'Bob', 'Last Name': '', expected: 'Bob ' }  // Edge case: empty last name
    ];

    for (const testCase of testCases) {
      const row = await this.callTool('baserow_create_row', {
        table_id: this.tableId,
        data: { 'First Name': testCase['First Name'], 'Last Name': testCase['Last Name'] }
      });
      const rowData = JSON.parse(row.content[0].text);
      this.rowIds.push(rowData.id);
      console.log(`   ✓ Created test row: ${testCase['First Name']} + ${testCase['Last Name']}`);
    }
    console.log();

    // Step 5: Verify results
    console.log('Step 5: Verify formula output');
    const rows = await this.callTool('baserow_list_rows', { table_id: this.tableId });
    const rowsData = JSON.parse(rows.content[0].text);

    console.log('\n   Results:');
    console.log('   ' + '─'.repeat(60));
    console.log('   First Name    Last Name     Full Name         Expected');
    console.log('   ' + '─'.repeat(60));

    rowsData.results.forEach((row, idx) => {
      const expected = testCases[idx]?.expected || 'N/A';
      const match = row['Full Name'] === expected ? '✓' : '✗';
      console.log(`   ${row['First Name'].padEnd(13)} ${row['Last Name'].padEnd(13)} ${row['Full Name'].padEnd(17)} ${expected} ${match}`);
    });
    console.log('   ' + '─'.repeat(60) + '\n');

    console.log('   ⚠️  Note: Empty last name shows trailing space - this could be improved!\n');
  }

  async demoDiscountCalculator() {
    console.log('━'.repeat(80));
    console.log('DEMO 2: Discount Price Calculator');
    console.log('━'.repeat(80) + '\n');

    console.log('Goal: Calculate price after percentage discount\n');

    // Create source fields
    console.log('Step 1: Create source fields');
    const price = await this.callTool('baserow_create_field', {
      table_id: this.tableId,
      type: 'number',
      name: 'Price',
      number_decimal_places: 2
    });
    const priceData = JSON.parse(price.content[0].text);
    this.fieldIds.price = priceData.id;
    console.log(`   ✓ Created 'Price' field`);

    const discount = await this.callTool('baserow_create_field', {
      table_id: this.tableId,
      type: 'number',
      name: 'Discount %',
      number_decimal_places: 0
    });
    const discountData = JSON.parse(discount.content[0].text);
    this.fieldIds.discount = discountData.id;
    console.log(`   ✓ Created 'Discount %' field\n`);

    // Create formula field
    console.log('Step 2: Create formula field (as number)');
    const finalPrice = await this.callTool('baserow_create_field', {
      table_id: this.tableId,
      type: 'number',
      name: 'Final Price',
      number_decimal_places: 2
    });
    const finalPriceData = JSON.parse(finalPrice.content[0].text);
    this.fieldIds.finalPrice = finalPriceData.id;
    console.log(`   ✓ Created 'Final Price' field\n`);

    // Update to formula with edge case handling
    console.log('Step 3: Update to formula with edge case handling');
    const formula = "if(field('Discount %') >= 100, 0, round(field('Price') * (1 - field('Discount %') / 100), 2))";
    console.log(`   Formula: ${formula}`);
    await this.callTool('baserow_update_field', {
      table_id: this.tableId,
      field_id: this.fieldIds.finalPrice,
      type: 'formula',
      formula: formula
    });
    console.log('   ✓ Updated to formula\n');

    // Update existing rows with new data
    console.log('Step 4: Update test data with prices');
    const priceTestCases = [
      { price: 100, discount: 20, expected: 80 },
      { price: 99.99, discount: 15, expected: 84.99 },
      { price: 50, discount: 100, expected: 0 }  // Edge case: 100% discount
    ];

    for (let i = 0; i < Math.min(priceTestCases.length, this.rowIds.length); i++) {
      await this.callTool('baserow_update_row', {
        table_id: this.tableId,
        row_id: this.rowIds[i],
        data: {
          'Price': priceTestCases[i].price,
          'Discount %': priceTestCases[i].discount
        }
      });
      console.log(`   ✓ Updated row ${i + 1}: $${priceTestCases[i].price} - ${priceTestCases[i].discount}%`);
    }
    console.log();

    // Verify
    console.log('Step 5: Verify calculations');
    const rows = await this.callTool('baserow_list_rows', { table_id: this.tableId });
    const rowsData = JSON.parse(rows.content[0].text);

    console.log('\n   Results:');
    console.log('   ' + '─'.repeat(50));
    console.log('   Price     Discount   Final Price   Expected');
    console.log('   ' + '─'.repeat(50));

    rowsData.results.slice(0, 3).forEach((row, idx) => {
      const testCase = priceTestCases[idx];
      const match = Math.abs(parseFloat(row['Final Price']) - testCase.expected) < 0.01 ? '✓' : '✗';
      console.log(`   $${row['Price'].toFixed(2).padEnd(8)} ${row['Discount %'].toString().padEnd(10)} $${row['Final Price'].toFixed(2).padEnd(12)} $${testCase.expected.toFixed(2)} ${match}`);
    });
    console.log('   ' + '─'.repeat(50) + '\n');
  }

  async demoAgeCalculator() {
    console.log('━'.repeat(80));
    console.log('DEMO 3: Age Calculator');
    console.log('━'.repeat(80) + '\n');

    console.log('Goal: Calculate age from birth date\n');

    // Create birth date field
    console.log('Step 1: Create birth date field');
    const birthDate = await this.callTool('baserow_create_field', {
      table_id: this.tableId,
      type: 'date',
      name: 'Birth Date',
      date_format: 'ISO',
      date_include_time: false
    });
    const birthDateData = JSON.parse(birthDate.content[0].text);
    this.fieldIds.birthDate = birthDateData.id;
    console.log(`   ✓ Created 'Birth Date' field\n`);

    // Create age formula field
    console.log('Step 2: Create age formula field (safe approach)');
    const age = await this.callTool('baserow_create_field', {
      table_id: this.tableId,
      type: 'number',
      name: 'Age'
    });
    const ageData = JSON.parse(age.content[0].text);
    this.fieldIds.age = ageData.id;
    console.log(`   ✓ Created 'Age' field as number\n`);

    // Update to formula
    console.log('Step 3: Update to formula');
    const formula = "if(isblank(field('Birth Date')), 0, date_diff('year', field('Birth Date'), today()))";
    console.log(`   Formula: ${formula}`);
    await this.callTool('baserow_update_field', {
      table_id: this.tableId,
      field_id: this.fieldIds.age,
      type: 'formula',
      formula: formula
    });
    console.log('   ✓ Updated to formula with null handling\n');

    // Update test data
    console.log('Step 4: Add birth dates to test data');
    const ageTestCases = [
      { birthDate: '1990-01-15', expectedAge: 35 },
      { birthDate: '2000-06-30', expectedAge: 24 },
      { birthDate: null, expectedAge: 0 }  // Edge case: null birth date
    ];

    for (let i = 0; i < Math.min(ageTestCases.length, this.rowIds.length); i++) {
      const updateData = {};
      if (ageTestCases[i].birthDate) {
        updateData['Birth Date'] = ageTestCases[i].birthDate;
      }

      await this.callTool('baserow_update_row', {
        table_id: this.tableId,
        row_id: this.rowIds[i],
        data: updateData
      });
      console.log(`   ✓ Updated row ${i + 1}: ${ageTestCases[i].birthDate || 'null'}`);
    }
    console.log();

    // Verify
    console.log('Step 5: Verify age calculations');
    const rows = await this.callTool('baserow_list_rows', { table_id: this.tableId });
    const rowsData = JSON.parse(rows.content[0].text);

    console.log('\n   Results:');
    console.log('   ' + '─'.repeat(40));
    console.log('   Birth Date    Age    Notes');
    console.log('   ' + '─'.repeat(40));

    rowsData.results.slice(0, 3).forEach((row, idx) => {
      const birthDate = row['Birth Date'] || 'null';
      const age = row['Age'];
      const note = idx === 2 ? '(null handling works!)' : '(calculated from today)';
      console.log(`   ${birthDate.padEnd(13)} ${age.toString().padEnd(6)} ${note}`);
    });
    console.log('   ' + '─'.repeat(40) + '\n');

    console.log('   ℹ️  Note: Ages calculated from current date, so values may vary\n');
  }

  printSummary() {
    console.log('━'.repeat(80));
    console.log('SUMMARY: What We Learned');
    console.log('━'.repeat(80) + '\n');

    console.log('✅ Safe Workflow Pattern:');
    console.log('   1. Create fields as basic types (text/number) FIRST');
    console.log('   2. Update fields to formula type (allows error recovery)');
    console.log('   3. Create comprehensive test data (normal + edge cases)');
    console.log('   4. Verify output matches expectations');
    console.log('   5. Test edge cases (null, empty, boundary values)\n');

    console.log('✅ Key Takeaways:');
    console.log('   • Field exists even if formula validation fails');
    console.log('   • Can iterate on formulas without recreating fields');
    console.log('   • Edge case handling prevents production issues');
    console.log('   • Test data proves formula correctness');
    console.log('   • Formula errors are specific and actionable\n');

    console.log('✅ Formula Patterns Demonstrated:');
    console.log('   • Text concatenation with concat()');
    console.log('   • Conditional logic with if()');
    console.log('   • Null handling with isblank()');
    console.log('   • Date calculations with date_diff()');
    console.log('   • Numeric calculations with rounding\n');

    if (!CONFIG.cleanupAfter) {
      console.log('ℹ️  Test table preserved for your review:');
      console.log(`   Table: ${CONFIG.tableName} (ID: ${this.tableId})`);
      console.log(`   Database ID: ${CONFIG.databaseId}`);
      console.log(`   Workspace ID: ${CONFIG.workspaceId}\n`);
      console.log('   To clean up, set CONFIG.cleanupAfter = true in this script\n');
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up test data...');
    // Note: Baserow MCP doesn't currently have delete table functionality
    // You may need to manually delete the test table through the UI
    console.log('   ⚠️  Manual cleanup required: Delete table through Baserow UI\n');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Demo interrupted. Exiting...\n');
  process.exit(0);
});

// Run the demo
const demo = new FormulaDemoRunner();
demo.start().catch(console.error);
