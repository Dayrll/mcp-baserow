import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASEROW_API_URL = process.env.BASEROW_API_URL;
const USERNAME = process.env.BASEROW_USERNAME;
const PASSWORD = process.env.BASEROW_PASSWORD;

const tableId = 806;
const field1Id = 7861;
const field2Id = 7862;
const field3Id = 7863;

console.log('🚀 Populating Table with Lorem Ipsum Data\n');

async function main() {
  try {
    // Authenticate
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

    // Get existing rows
    console.log('2️⃣ Fetching existing rows...');
    const rowsResponse = await axios.get(
      `${BASEROW_API_URL}/api/database/rows/table/${tableId}/?user_field_names=true`,
      { headers }
    );

    const rows = rowsResponse.data.results;
    console.log(`✅ Found ${rows.length} rows\n`);

    // Lorem ipsum data for the three fields
    const loremData = [
      ['Lorem ipsum', 'dolor sit amet', 'consectetur'],
      ['Adipiscing elit', 'sed do eiusmod', 'tempor'],
      ['Incididunt ut', 'labore et dolore', 'magna aliqua'],
      ['Ut enim ad', 'minim veniam', 'quis nostrud'],
      ['Exercitation', 'ullamco laboris', 'nisi ut aliquip']
    ];

    // Update rows
    console.log('3️⃣ Updating rows with lorem ipsum data...');
    for (let i = 0; i < Math.min(rows.length, loremData.length); i++) {
      const rowId = rows[i].id;
      const updateData = {
        'Field 1': loremData[i][0],
        'Field 2': loremData[i][1],
        'Field 3': loremData[i][2]
      };

      await axios.patch(
        `${BASEROW_API_URL}/api/database/rows/table/${tableId}/${rowId}/?user_field_names=true`,
        updateData,
        { headers }
      );
      console.log(`  ✓ Row ${rowId}: ${loremData[i].join(' | ')}`);
    }

    // List final rows
    console.log('\n4️⃣ Final table contents:');
    const finalRowsResponse = await axios.get(
      `${BASEROW_API_URL}/api/database/rows/table/${tableId}/?user_field_names=true`,
      { headers }
    );

    finalRowsResponse.data.results.forEach((row, idx) => {
      console.log(`\n  Row ${idx + 1}:`);
      console.log(`    Name: ${row.Name}`);
      console.log(`    Field 1: ${row['Field 1'] || '(empty)'}`);
      console.log(`    Field 2: ${row['Field 2'] || '(empty)'}`);
      console.log(`    Field 3: ${row['Field 3'] || '(empty)'}`);
    });

    console.log('\n🎉 Data populated successfully!');
    console.log(`\nView in Baserow: ${BASEROW_API_URL.replace('/api', '')}/database/${tableId}/table/${tableId}`);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

main();
