import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASEROW_API_URL = process.env.BASEROW_API_URL;
const USERNAME = process.env.BASEROW_USERNAME;
const PASSWORD = process.env.BASEROW_PASSWORD;

const tableId = 806; // From the previous script

console.log('🚀 Adding Custom Fields to Test Table\n');

async function main() {
  try {
    // Step 1: Authenticate
    console.log('1️⃣ Authenticating...');
    const authResponse = await axios.post(`${BASEROW_API_URL}/api/user/token-auth/`, {
      username: USERNAME,
      password: PASSWORD
    });
    const token = authResponse.data.access_token;
    console.log('✅ Authenticated\n');

    const headers = {
      'Authorization': `JWT ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Add Field 1 (text field)
    console.log('2️⃣ Adding Field 1 (text)...');
    const field1Response = await axios.post(
      `${BASEROW_API_URL}/api/database/fields/table/${tableId}/`,
      {
        name: 'Field 1',
        type: 'text'
      },
      { headers }
    );
    console.log(`✅ Field 1 created (ID: ${field1Response.data.id})\n`);

    // Step 3: Add Field 2 (text field)
    console.log('3️⃣ Adding Field 2 (text)...');
    const field2Response = await axios.post(
      `${BASEROW_API_URL}/api/database/fields/table/${tableId}/`,
      {
        name: 'Field 2',
        type: 'text'
      },
      { headers }
    );
    console.log(`✅ Field 2 created (ID: ${field2Response.data.id})\n`);

    // Step 4: Add Field 3 (text field)
    console.log('4️⃣ Adding Field 3 (text)...');
    const field3Response = await axios.post(
      `${BASEROW_API_URL}/api/database/fields/table/${tableId}/`,
      {
        name: 'Field 3',
        type: 'text'
      },
      { headers }
    );
    console.log(`✅ Field 3 created (ID: ${field3Response.data.id})\n`);

    // Step 5: Get updated table structure
    console.log('5️⃣ Verifying table structure...');
    const tableResponse = await axios.get(
      `${BASEROW_API_URL}/api/database/tables/${tableId}/`,
      { headers }
    );

    console.log('✅ Current fields:');
    tableResponse.data.fields.forEach(field => {
      console.log(`  - ${field.name} (${field.type})`);
    });

    // Step 6: Update existing rows with lorem ipsum data
    console.log('\n6️⃣ Updating rows with lorem ipsum data...');

    const field1Name = `field_${field1Response.data.id}`;
    const field2Name = `field_${field2Response.data.id}`;
    const field3Name = `field_${field3Response.data.id}`;

    const loremWords = [
      ['Lorem', 'ipsum', 'dolor'],
      ['Consectetur', 'adipiscing', 'elit'],
      ['Sed', 'do', 'eiusmod'],
      ['Tempor', 'incididunt', 'ut'],
      ['Labore', 'et', 'dolore']
    ];

    // Get existing rows
    const rowsResponse = await axios.get(
      `${BASEROW_API_URL}/api/database/rows/table/${tableId}/`,
      { headers }
    );

    const rows = rowsResponse.data.results;

    for (let i = 0; i < Math.min(rows.length, loremWords.length); i++) {
      const rowId = rows[i].id;
      const updateData = {};
      updateData[field1Name] = loremWords[i][0];
      updateData[field2Name] = loremWords[i][1];
      updateData[field3Name] = loremWords[i][2];

      await axios.patch(
        `${BASEROW_API_URL}/api/database/rows/table/${tableId}/${rowId}/`,
        updateData,
        { headers }
      );
      console.log(`  ✓ Row ${i + 1}: ${loremWords[i].join(' | ')}`);
    }

    console.log('\n🎉 Custom fields added and populated!');
    console.log(`\nTable ID: ${tableId}`);
    console.log('Fields: Name, Notes, Active, Field 1, Field 2, Field 3');
    console.log(`Rows with data: ${Math.min(rows.length, loremWords.length)}`);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

main();
