# Formula Field Recipes

A copy-paste cookbook of common Baserow formula patterns. Each recipe includes the formula, test data, expected output, and a complete testing workflow.

## How to Use This Cookbook

1. Find a recipe that matches your needs
2. Follow the testing template to safely implement
3. Adapt the formula to your specific field names
4. Test with the provided test data
5. Verify edge cases work correctly

**Remember the safe workflow:**
1. Create field as text/number first
2. Update field with formula
3. Create test data
4. Verify output
5. Test edge cases

## Text Operations

### Recipe: Full Name from First and Last

**Goal:** Combine first and last name with proper spacing and handle empty fields.

**Formula:**
```
if(
  AND(field('First Name') != '', field('Last Name') != ''),
  concat(field('First Name'), ' ', field('Last Name')),
  if(field('First Name') != '', field('First Name'), field('Last Name'))
)
```

**Test Data:**
```json
{"First Name": "Jane", "Last Name": "Smith"}
{"First Name": "John", "Last Name": ""}
{"First Name": "", "Last Name": "Doe"}
{"First Name": "", "Last Name": ""}
```

**Expected Output:**
```
"Jane Smith"
"John"
"Doe"
""
```

**Testing Template:**
```javascript
// 1. Create source fields (if they don't exist)
"Create text field 'First Name' in table [ID]"
"Create text field 'Last Name' in table [ID]"

// 2. Create formula field as text
"Create text field 'Full Name' in table [ID]"

// 3. Update with formula
"Update field [ID] to formula: if(AND(field('First Name') != '', field('Last Name') != ''), concat(field('First Name'), ' ', field('Last Name')), if(field('First Name') != '', field('First Name'), field('Last Name')))"

// 4. Create test rows
"Create row with First Name 'Jane' and Last Name 'Smith'"
"Create row with First Name 'John' and Last Name ''"

// 5. Verify
"List rows to verify Full Name values"
```

---

### Recipe: Email Validation Badge

**Goal:** Display validation status for email addresses.

**Formula:**
```
if(
  field('Email') = '',
  '⚪ No Email',
  if(
    regex_match(field('Email'), '^[^@]+@[^@]+\\.[^@]+$'),
    '✅ Valid',
    '❌ Invalid'
  )
)
```

**Test Data:**
```json
{"Email": "user@example.com"}
{"Email": "invalid.email"}
{"Email": ""}
{"Email": "missing@domain"}
```

**Expected Output:**
```
"✅ Valid"
"❌ Invalid"
"⚪ No Email"
"❌ Invalid"
```

---

### Recipe: Initials from Full Name

**Goal:** Extract initials from a full name.

**Formula:**
```
if(
  field('Full Name') = '',
  '',
  concat(
    upper(left(field('Full Name'), 1)),
    if(
      contains(field('Full Name'), ' '),
      upper(left(right(field('Full Name'), length(field('Full Name')) - search(field('Full Name'), ' ')), 1)),
      ''
    )
  )
)
```

**Test Data:**
```json
{"Full Name": "John Doe"}
{"Full Name": "Jane"}
{"Full Name": ""}
```

**Expected Output:**
```
"JD"
"J"
""
```

---

### Recipe: Formatted Phone Number

**Goal:** Format a 10-digit phone number as (XXX) XXX-XXXX.

**Formula:**
```
if(
  length(field('Phone')) = 10,
  concat(
    '(',
    left(field('Phone'), 3),
    ') ',
    substring(field('Phone'), 3, 3),
    '-',
    right(field('Phone'), 4)
  ),
  field('Phone')
)
```

**Test Data:**
```json
{"Phone": "5551234567"}
{"Phone": "123"}
{"Phone": ""}
```

**Expected Output:**
```
"(555) 123-4567"
"123"
""
```

---

### Recipe: Character Count with Limit Warning

**Goal:** Show character count and warn when approaching limit.

**Formula:**
```
if(
  field('Description') = '',
  '0/500',
  if(
    length(field('Description')) > 450,
    concat(totext(length(field('Description'))), '/500 ⚠️ Near Limit'),
    concat(totext(length(field('Description'))), '/500')
  )
)
```

**Test Data:**
```json
{"Description": "Short text"}
{"Description": "[450+ character string]"}
{"Description": ""}
```

**Expected Output:**
```
"10/500"
"460/500 ⚠️ Near Limit"
"0/500"
```

## Date Calculations

### Recipe: Age from Birth Date

**Goal:** Calculate current age in years.

**Formula:**
```
if(
  isblank(field('Birth Date')),
  0,
  date_diff('year', field('Birth Date'), today())
)
```

**Test Data:**
```json
{"Birth Date": "1990-01-15"}
{"Birth Date": "2000-06-30"}
{"Birth Date": null}
```

**Expected Output (as of 2025):**
```
35
24
0
```

---

### Recipe: Days Until Event

**Goal:** Count days until a future event with status indicators.

**Formula:**
```
if(
  isblank(field('Event Date')),
  'No date set',
  if(
    date_diff('day', today(), field('Event Date')) < 0,
    '✅ Past Event',
    if(
      date_diff('day', today(), field('Event Date')) = 0,
      '🔥 TODAY',
      concat(totext(date_diff('day', today(), field('Event Date'))), ' days away')
    )
  )
)
```

**Test Data:**
```json
{"Event Date": "2025-12-31"}
{"Event Date": "2024-01-01"}
{"Event Date": "[today's date]"}
{"Event Date": null}
```

**Expected Output:**
```
"340 days away" (varies)
"✅ Past Event"
"🔥 TODAY"
"No date set"
```

---

### Recipe: Project Duration in Days

**Goal:** Calculate project length between start and end dates.

**Formula:**
```
if(
  OR(isblank(field('Start Date')), isblank(field('End Date'))),
  0,
  date_diff('day', field('Start Date'), field('End Date'))
)
```

**Test Data:**
```json
{"Start Date": "2025-01-01", "End Date": "2025-01-31"}
{"Start Date": "2025-01-15", "End Date": "2025-01-15"}
{"Start Date": null, "End Date": "2025-01-31"}
```

**Expected Output:**
```
30
0
0
```

---

### Recipe: Quarter from Date

**Goal:** Determine fiscal quarter from a date.

**Formula:**
```
if(
  isblank(field('Date')),
  '',
  concat(
    'Q',
    totext(
      if(month(field('Date')) <= 3, 1,
        if(month(field('Date')) <= 6, 2,
          if(month(field('Date')) <= 9, 3, 4)
        )
      )
    ),
    ' ',
    totext(year(field('Date')))
  )
)
```

**Test Data:**
```json
{"Date": "2025-01-15"}
{"Date": "2025-04-15"}
{"Date": "2025-07-15"}
{"Date": "2025-10-15"}
```

**Expected Output:**
```
"Q1 2025"
"Q2 2025"
"Q3 2025"
"Q4 2025"
```

---

### Recipe: Business Days Between Dates (Approximate)

**Goal:** Estimate working days between two dates (weekdays only, no holidays).

**Formula:**
```
if(
  OR(isblank(field('Start Date')), isblank(field('End Date'))),
  0,
  round(date_diff('day', field('Start Date'), field('End Date')) * 5 / 7, 0)
)
```

**Test Data:**
```json
{"Start Date": "2025-01-06", "End Date": "2025-01-17"}
{"Start Date": "2025-01-01", "End Date": "2025-01-01"}
```

**Expected Output:**
```
8
0
```

## Numeric Operations

### Recipe: Discount Price Calculator

**Goal:** Calculate final price after percentage discount, preventing negative prices.

**Formula:**
```
if(
  OR(isblank(field('Price')), field('Price') = 0),
  0,
  if(
    field('Discount Percent') >= 100,
    0,
    round(field('Price') * (1 - field('Discount Percent') / 100), 2)
  )
)
```

**Test Data:**
```json
{"Price": 100, "Discount Percent": 20}
{"Price": 99.99, "Discount Percent": 15}
{"Price": 100, "Discount Percent": 100}
{"Price": 100, "Discount Percent": 150}
{"Price": 0, "Discount Percent": 20}
```

**Expected Output:**
```
80.00
84.99
0
0
0
```

---

### Recipe: Sales Tax Calculator

**Goal:** Add sales tax to subtotal and round to 2 decimals.

**Formula:**
```
if(
  isblank(field('Subtotal')),
  0,
  round(field('Subtotal') * (1 + field('Tax Rate') / 100), 2)
)
```

**Test Data:**
```json
{"Subtotal": 100, "Tax Rate": 8.5}
{"Subtotal": 99.99, "Tax Rate": 10}
{"Subtotal": 0, "Tax Rate": 8.5}
```

**Expected Output:**
```
108.50
109.99
0
```

---

### Recipe: Percentage Calculation

**Goal:** Calculate what percentage one number is of another.

**Formula:**
```
if(
  OR(isblank(field('Part')), isblank(field('Total')), field('Total') = 0),
  0,
  round((field('Part') / field('Total')) * 100, 2)
)
```

**Test Data:**
```json
{"Part": 25, "Total": 100}
{"Part": 75, "Total": 200}
{"Part": 50, "Total": 0}
{"Part": 0, "Total": 100}
```

**Expected Output:**
```
25.00
37.50
0
0
```

---

### Recipe: Profit Margin Percentage

**Goal:** Calculate profit margin as a percentage of revenue.

**Formula:**
```
if(
  OR(isblank(field('Revenue')), field('Revenue') = 0),
  0,
  round(((field('Revenue') - field('Costs')) / field('Revenue')) * 100, 2)
)
```

**Test Data:**
```json
{"Revenue": 1000, "Costs": 600}
{"Revenue": 1000, "Costs": 1000}
{"Revenue": 1000, "Costs": 1200}
{"Revenue": 0, "Costs": 100}
```

**Expected Output:**
```
40.00
0
-20.00
0
```

---

### Recipe: Running Total per Unit

**Goal:** Calculate per-unit price from total and quantity.

**Formula:**
```
if(
  OR(isblank(field('Quantity')), field('Quantity') = 0),
  0,
  round(field('Total') / field('Quantity'), 2)
)
```

**Test Data:**
```json
{"Total": 100, "Quantity": 4}
{"Total": 99.99, "Quantity": 3}
{"Total": 100, "Quantity": 0}
```

**Expected Output:**
```
25.00
33.33
0
```

---

### Recipe: BMI Calculator

**Goal:** Calculate Body Mass Index from height (cm) and weight (kg).

**Formula:**
```
if(
  OR(isblank(field('Height')), isblank(field('Weight')), field('Height') = 0),
  0,
  round(field('Weight') / ((field('Height') / 100) * (field('Height') / 100)), 1)
)
```

**Test Data:**
```json
{"Height": 175, "Weight": 70}
{"Height": 160, "Weight": 65}
{"Height": 0, "Weight": 70}
```

**Expected Output:**
```
22.9
25.4
0
```

## Conditional Logic

### Recipe: Task Priority Assigner

**Goal:** Assign priority level based on urgency and importance.

**Formula:**
```
if(
  AND(field('Urgent'), field('Important')),
  'P0 - Critical',
  if(
    field('Urgent'),
    'P1 - High',
    if(
      field('Important'),
      'P2 - Medium',
      'P3 - Low'
    )
  )
)
```

**Test Data:**
```json
{"Urgent": true, "Important": true}
{"Urgent": true, "Important": false}
{"Urgent": false, "Important": true}
{"Urgent": false, "Important": false}
```

**Expected Output:**
```
"P0 - Critical"
"P1 - High"
"P2 - Medium"
"P3 - Low"
```

---

### Recipe: Grade Letter from Score

**Goal:** Convert numeric score to letter grade.

**Formula:**
```
if(
  field('Score') >= 90,
  'A',
  if(
    field('Score') >= 80,
    'B',
    if(
      field('Score') >= 70,
      'C',
      if(
        field('Score') >= 60,
        'D',
        'F'
      )
    )
  )
)
```

**Test Data:**
```json
{"Score": 95}
{"Score": 85}
{"Score": 75}
{"Score": 65}
{"Score": 55}
```

**Expected Output:**
```
"A"
"B"
"C"
"D"
"F"
```

---

### Recipe: Shipping Cost by Weight

**Goal:** Calculate shipping cost based on weight tiers.

**Formula:**
```
if(
  field('Weight') <= 1,
  5.99,
  if(
    field('Weight') <= 5,
    9.99,
    if(
      field('Weight') <= 10,
      14.99,
      19.99
    )
  )
)
```

**Test Data:**
```json
{"Weight": 0.5}
{"Weight": 3}
{"Weight": 7}
{"Weight": 15}
```

**Expected Output:**
```
5.99
9.99
14.99
19.99
```

---

### Recipe: Project Status from Completion

**Goal:** Show status with emoji based on completion percentage.

**Formula:**
```
if(
  field('Completion') >= 100,
  '✅ Complete',
  if(
    field('Completion') >= 75,
    '🟢 Nearly Done',
    if(
      field('Completion') >= 50,
      '🟡 In Progress',
      if(
        field('Completion') >= 25,
        '🟠 Started',
        '🔴 Not Started'
      )
    )
  )
)
```

**Test Data:**
```json
{"Completion": 100}
{"Completion": 80}
{"Completion": 60}
{"Completion": 30}
{"Completion": 10}
```

**Expected Output:**
```
"✅ Complete"
"🟢 Nearly Done"
"🟡 In Progress"
"🟠 Started"
"🔴 Not Started"
```

## Boolean Operations

### Recipe: Form Completeness Check

**Goal:** Verify all required fields are filled.

**Formula:**
```
AND(
  field('Name') != '',
  field('Email') != '',
  field('Phone') != '',
  NOT(isblank(field('Birth Date')))
)
```

**Test Data:**
```json
{"Name": "John", "Email": "j@e.com", "Phone": "555-1234", "Birth Date": "1990-01-01"}
{"Name": "Jane", "Email": "", "Phone": "555-1234", "Birth Date": "1990-01-01"}
{"Name": "", "Email": "", "Phone": "", "Birth Date": null}
```

**Expected Output:**
```
true
false
false
```

---

### Recipe: Eligibility Check (Multi-Condition)

**Goal:** Check if person meets all eligibility criteria.

**Formula:**
```
AND(
  field('Age') >= 18,
  field('Verified'),
  field('Balance') >= 0
)
```

**Test Data:**
```json
{"Age": 25, "Verified": true, "Balance": 100}
{"Age": 16, "Verified": true, "Balance": 100}
{"Age": 25, "Verified": false, "Balance": 100}
{"Age": 25, "Verified": true, "Balance": -50}
```

**Expected Output:**
```
true
false
false
false
```

---

### Recipe: Any Alert Condition

**Goal:** Check if any alert condition is triggered.

**Formula:**
```
OR(
  field('Temperature') > 100,
  field('Pressure') < 10,
  field('Error Count') > 5
)
```

**Test Data:**
```json
{"Temperature": 105, "Pressure": 50, "Error Count": 0}
{"Temperature": 90, "Pressure": 5, "Error Count": 0}
{"Temperature": 90, "Pressure": 50, "Error Count": 10}
{"Temperature": 90, "Pressure": 50, "Error Count": 0}
```

**Expected Output:**
```
true
true
true
false
```

---

### Recipe: Status Text from Boolean

**Goal:** Convert boolean flag to human-readable status.

**Formula:**
```
if(field('Active'), '🟢 Active', '⚫ Inactive')
```

**Test Data:**
```json
{"Active": true}
{"Active": false}
```

**Expected Output:**
```
"🟢 Active"
"⚫ Inactive"
```

## Multi-Field Calculations

### Recipe: Full Address Formatter

**Goal:** Combine address fields into formatted full address.

**Formula:**
```
concat(
  field('Street'),
  if(field('Apt') = '', '', concat(', Apt ', field('Apt'))),
  ', ',
  field('City'),
  ', ',
  field('State'),
  ' ',
  field('Zip')
)
```

**Test Data:**
```json
{"Street": "123 Main St", "Apt": "4B", "City": "Boston", "State": "MA", "Zip": "02101"}
{"Street": "456 Oak Ave", "Apt": "", "City": "Austin", "State": "TX", "Zip": "78701"}
```

**Expected Output:**
```
"123 Main St, Apt 4B, Boston, MA 02101"
"456 Oak Ave, Austin, TX 78701"
```

---

### Recipe: Total Cost with Shipping and Tax

**Goal:** Calculate final total including item cost, shipping, and tax.

**Formula:**
```
round(
  (field('Item Cost') + field('Shipping Cost')) * (1 + field('Tax Rate') / 100),
  2
)
```

**Test Data:**
```json
{"Item Cost": 100, "Shipping Cost": 10, "Tax Rate": 8.5}
{"Item Cost": 50, "Shipping Cost": 5, "Tax Rate": 0}
```

**Expected Output:**
```
119.35
55.00
```

---

### Recipe: Customer Tier by Purchase History

**Goal:** Assign customer tier based on total purchases and account age.

**Formula:**
```
if(
  AND(
    field('Total Purchases') > 1000,
    date_diff('year', field('Account Created'), today()) > 1
  ),
  'Gold',
  if(
    OR(
      field('Total Purchases') > 500,
      date_diff('year', field('Account Created'), today()) > 1
    ),
    'Silver',
    'Bronze'
  )
)
```

**Test Data:**
```json
{"Total Purchases": 1500, "Account Created": "2020-01-01"}
{"Total Purchases": 800, "Account Created": "2024-06-01"}
{"Total Purchases": 200, "Account Created": "2020-01-01"}
{"Total Purchases": 100, "Account Created": "2024-06-01"}
```

**Expected Output:**
```
"Gold"
"Silver"
"Silver"
"Bronze"
```

---

### Recipe: Stock Reorder Status

**Goal:** Determine if item needs reordering based on current stock and reorder level.

**Formula:**
```
if(
  field('Current Stock') <= field('Reorder Level'),
  '🔴 ORDER NOW',
  if(
    field('Current Stock') <= field('Reorder Level') * 1.5,
    '🟡 Low Stock',
    '🟢 In Stock'
  )
)
```

**Test Data:**
```json
{"Current Stock": 10, "Reorder Level": 20}
{"Current Stock": 25, "Reorder Level": 20}
{"Current Stock": 50, "Reorder Level": 20}
```

**Expected Output:**
```
"🔴 ORDER NOW"
"🟡 Low Stock"
"🟢 In Stock"
```

---

### Recipe: Meeting Duration in Hours

**Goal:** Calculate meeting duration from start and end times (same day).

**Formula:**
```
if(
  OR(isblank(field('Start Time')), isblank(field('End Time'))),
  0,
  round(date_diff('minute', field('Start Time'), field('End Time')) / 60, 2)
)
```

**Test Data:**
```json
{"Start Time": "2025-01-23 09:00", "End Time": "2025-01-23 11:30"}
{"Start Time": "2025-01-23 14:00", "End Time": "2025-01-23 14:45"}
{"Start Time": null, "End Time": "2025-01-23 11:30"}
```

**Expected Output:**
```
2.50
0.75
0
```

## Advanced Patterns

### Recipe: Compound Interest Calculator

**Goal:** Calculate future value with compound interest.

**Formula:**
```
if(
  OR(isblank(field('Principal')), isblank(field('Rate')), isblank(field('Years'))),
  0,
  round(
    field('Principal') * power(1 + field('Rate') / 100, field('Years')),
    2
  )
)
```

**Test Data:**
```json
{"Principal": 1000, "Rate": 5, "Years": 10}
{"Principal": 5000, "Rate": 3, "Years": 5}
```

**Expected Output:**
```
1628.89
5796.37
```

---

### Recipe: Multi-Criteria Search Match Score

**Goal:** Score how well a record matches search criteria.

**Formula:**
```
totext(
  (if(contains(lower(field('Name')), lower(field('Search Term'))), 1, 0)) +
  (if(contains(lower(field('Description')), lower(field('Search Term'))), 1, 0)) +
  (if(contains(lower(field('Tags')), lower(field('Search Term'))), 1, 0))
) + '/3 matches'
```

**Test Data:**
```json
{"Name": "Blue Widget", "Description": "A blue colored item", "Tags": "blue, widget", "Search Term": "blue"}
{"Name": "Red Widget", "Description": "Not matching", "Tags": "red", "Search Term": "blue"}
```

**Expected Output:**
```
"3/3 matches"
"0/3 matches"
```

---

### Recipe: Conditional Formatting Code

**Goal:** Return a code for conditional formatting based on multiple factors.

**Formula:**
```
if(
  field('Priority') = 'High' AND field('Overdue'),
  'RED',
  if(
    field('Priority') = 'High',
    'ORANGE',
    if(
      field('Overdue'),
      'YELLOW',
      'GREEN'
    )
  )
)
```

**Test Data:**
```json
{"Priority": "High", "Overdue": true}
{"Priority": "High", "Overdue": false}
{"Priority": "Low", "Overdue": true}
{"Priority": "Low", "Overdue": false}
```

**Expected Output:**
```
"RED"
"ORANGE"
"YELLOW"
"GREEN"
```

## Quick Reference: Common Functions

**Text:**
- `concat(a, b, ...)` - Combine strings
- `upper(text)` - Convert to uppercase
- `lower(text)` - Convert to lowercase
- `length(text)` - Get string length
- `left(text, n)` - First n characters
- `right(text, n)` - Last n characters
- `substring(text, start, length)` - Extract substring
- `replace(text, old, new)` - Replace substring
- `contains(text, search)` - Check if contains
- `regex_match(text, pattern)` - Regex pattern match

**Date:**
- `today()` - Current date
- `now()` - Current date and time
- `date_diff(unit, start, end)` - Difference between dates
- `year(date)` - Extract year
- `month(date)` - Extract month (1-12)
- `day(date)` - Extract day of month

**Numeric:**
- `round(number, decimals)` - Round to decimals
- `floor(number)` - Round down
- `ceil(number)` - Round up
- `power(base, exponent)` - Exponentiation
- `sum(field)` - Sum lookup values

**Conditional:**
- `if(condition, true_value, false_value)` - If/then/else
- `AND(cond1, cond2, ...)` - All true
- `OR(cond1, cond2, ...)` - Any true
- `NOT(condition)` - Negate

**Type Conversion:**
- `totext(value)` - Convert to text
- `tonumber(text)` - Convert to number
- `todate(text, format)` - Convert to date

**Null Handling:**
- `isblank(field)` - Check if null or empty

## Tips for Adapting Recipes

1. **Replace field names:** Change `field('Field Name')` to match your actual field names
2. **Adjust thresholds:** Modify numeric values (like `> 100`) to match your needs
3. **Change formats:** Adapt date formats, decimal places, or text strings
4. **Test thoroughly:** Always create test data to verify your adapted formula works
5. **Handle nulls:** Add `isblank()` checks if your data might have null values

## See Also

- [Formula Fields Guide](./formula-fields-guide.md) - Comprehensive reference and concepts
- [Formula Testing Workflow](./formula-testing-workflow.md) - Step-by-step testing process
- [Basic Usage](./basic-usage.md) - General MCP usage examples

---

**Remember:** Always use the safe workflow pattern:
1. Create field as basic type
2. Update with formula
3. Test with known data
4. Verify output
5. Test edge cases
