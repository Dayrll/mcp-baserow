# Baserow Formula Fields - Comprehensive Guide

## Overview

Formula fields in Baserow are powerful, read-only computed fields that automatically calculate values based on other fields in your table. They use a specialized formula language that gets compiled to SQL and executed server-side, ensuring consistent and performant calculations across your entire database.

**Why This Guide Emphasizes Safe Workflows:**
- Formula validation happens server-side - errors can prevent field creation
- Following the safe workflow pattern ensures fields exist even if formulas fail
- Iterative testing catches errors early and makes debugging easier
- Proper test data helps verify formulas work correctly for all edge cases

## Understanding Formula Fields

### Read-Only, Server-Side Computation

Formula fields are **fundamentally different** from regular fields:

- **Read-only**: Values are computed automatically; you cannot manually edit them
- **Server-compiled**: Formulas are parsed by Baserow's ANTLR4 parser into Python AST, then converted to Django Expressions, and finally compiled to PostgreSQL SQL
- **Type-safe**: Baserow's type system validates formulas and coerces types intelligently
- **Dependency-aware**: Circular dependencies are detected and prevented

### Architecture Overview

```
Your Formula → ANTLR4 Parser → Python AST → Django Expressions → PostgreSQL SQL
                     ↓                ↓                ↓
              Syntax Check    Type Validation    Dependency Check
```

**What this means for you:**
- Syntax errors are caught immediately during field creation/update
- Type mismatches are validated before execution
- Field reference errors fail fast with clear messages
- No client-side validation - all errors come from the Baserow API

## Formula Syntax Primer

### Field References

Reference other fields using the `field()` function:

```
field('Field Name')
```

**Important notes:**
- Field names are case-sensitive and must match exactly
- Use single quotes around field names
- Spaces in field names are allowed: `field('First Name')`
- If a field doesn't exist, you'll get a clear error message

### Operators

**Arithmetic:**
```
field('Price') * field('Quantity')          # Multiplication
field('Total') - field('Discount')          # Subtraction
field('Amount') + field('Tax')              # Addition
field('Total') / field('Count')             # Division
```

**Comparison:**
```
field('Age') > 18                           # Greater than
field('Status') = 'Active'                  # Equality
field('Score') >= 70                        # Greater than or equal
field('Name') != ''                         # Not equal
```

**Logical:**
```
field('Active') AND field('Verified')       # AND
field('Premium') OR field('Trial')          # OR
NOT(field('Deleted'))                       # NOT
```

**String:**
```
field('First Name') + ' ' + field('Last Name')  # Concatenation
```

### Common Functions

**Text Functions:**
```
concat(field('First'), ' ', field('Last'))   # Combine strings
upper(field('Name'))                         # Convert to uppercase
lower(field('Email'))                        # Convert to lowercase
length(field('Description'))                 # Get string length
replace(field('Text'), 'old', 'new')        # Replace substring
```

**Conditional Logic:**
```
if(condition, value_if_true, value_if_false)
if(field('Age') >= 18, 'Adult', 'Minor')
```

**Date Functions:**
```
todate(field('Date String'), 'US')          # Convert to date
date_interval(field('Days'))                # Create interval
now()                                        # Current date/time
today()                                     # Current date
```

**Numeric Functions:**
```
round(field('Value'), 2)                    # Round to decimals
floor(field('Value'))                       # Round down
ceil(field('Value'))                        # Round up
```

### Literals

```
'Text string'                               # String literal
42                                          # Number literal
true / false                                # Boolean literal
```

## Safe Workflow Pattern

**The 5-Step Safe Workflow** - Use this for ALL formula field development:

### Step 1: Create Field as Basic Type First

**Why:** Ensures the field exists in your table even if formula validation fails.

```
Create a text or number field first, then update it to a formula field.
```

**MCP Natural Language:**
> "Create a text field called 'Full Name' in the Users table"

**Direct Tool Call:**
```json
{
  "tool": "baserow_create_field",
  "table_id": 123,
  "type": "text",
  "name": "Full Name"
}
```

**Result:** Field ID returned (e.g., `456`) - save this for Step 2.

### Step 2: Update Field with Formula

**Why:** Allows graceful error handling and formula iteration without recreating the field.

**MCP Natural Language:**
> "Update field 456 in table 123 to be a formula field with the formula: concat(field('First Name'), ' ', field('Last Name'))"

**Direct Tool Call:**
```json
{
  "tool": "baserow_update_field",
  "table_id": 123,
  "field_id": 456,
  "type": "formula",
  "formula": "concat(field('First Name'), ' ', field('Last Name'))"
}
```

**If it fails:**
- Field still exists as text field
- Error message shows exactly what's wrong
- Fix formula and retry update
- No need to recreate the field

### Step 3: Create Test Data

**Why:** Enables verification that your formula produces expected results.

**Create rows with known values:**

```json
{
  "tool": "baserow_create_row",
  "table_id": 123,
  "data": {
    "First Name": "John",
    "Last Name": "Doe"
  }
}
```

**Test different scenarios:**
- Normal cases: typical expected inputs
- Edge cases: empty strings, null values, zero, very large numbers
- Boundary cases: maximum lengths, date ranges, numeric limits

### Step 4: Verify Formula Output

**Why:** Confirms formula calculates correctly and handles edge cases.

**MCP Natural Language:**
> "List all rows from table 123"

**Direct Tool Call:**
```json
{
  "tool": "baserow_list_rows",
  "table_id": 123
}
```

**Check the output:**
- Does "Full Name" show "John Doe"? ✓
- Are there any null or unexpected values?
- Do edge cases produce correct results?

### Step 5: Test Edge Cases

**Why:** Ensures robustness across all possible data scenarios.

**Create test rows for:**

```json
// Empty first name
{"First Name": "", "Last Name": "Doe"}

// Empty last name
{"First Name": "John", "Last Name": ""}

// Both empty
{"First Name": "", "Last Name": ""}

// Null handling (omit fields)
{}
```

**Expected behaviors to verify:**
- Empty strings: Should they show as blank or default text?
- Null values: How does your formula handle missing data?
- Type coercion: Do numbers become strings correctly?
- Boundary values: Max lengths, date ranges, etc.

## Common Formula Patterns

### Text Manipulation

#### Pattern: Full Name Concatenation

**Goal:** Combine first and last name with proper spacing.

**Formula:**
```
concat(field('First Name'), ' ', field('Last Name'))
```

**Test Data:**
```json
{"First Name": "Jane", "Last Name": "Smith"}
```

**Expected Output:**
```
"Jane Smith"
```

**Edge Cases:**
```json
{"First Name": "", "Last Name": "Smith"}      → " Smith" (leading space!)
{"First Name": "Jane", "Last Name": ""}       → "Jane " (trailing space!)
```

**Better Formula (handles empty fields):**
```
if(
  AND(field('First Name') != '', field('Last Name') != ''),
  concat(field('First Name'), ' ', field('Last Name')),
  if(field('First Name') != '', field('First Name'), field('Last Name'))
)
```

#### Pattern: Email Validation Status

**Goal:** Check if email field contains @ symbol.

**Formula:**
```
if(
  field('Email') = '',
  'No Email',
  if(regex_match(field('Email'), '.*@.*'), 'Valid', 'Invalid')
)
```

**Test Data:**
```json
{"Email": "user@example.com"}     → "Valid"
{"Email": "invalid.email"}        → "Invalid"
{"Email": ""}                     → "No Email"
```

### Date Calculations

#### Pattern: Age from Birth Date

**Goal:** Calculate age in years from birth date.

**Formula:**
```
date_diff('year', field('Birth Date'), today())
```

**Test Data:**
```json
{"Birth Date": "1990-01-15"}
```

**Expected Output (as of 2025):**
```
35
```

**Edge Cases:**
```json
{"Birth Date": ""}               → Error or null (test to confirm)
{"Birth Date": "2030-01-01"}     → Negative number (future date)
```

#### Pattern: Days Until Deadline

**Goal:** Show days remaining until a deadline.

**Formula:**
```
date_diff('day', today(), field('Deadline'))
```

**Test Data:**
```json
{"Deadline": "2025-12-31"}
```

**Expected Output (varies by current date):**
```
340  (if today is 2025-01-25)
```

**Enhanced with Status:**
```
if(
  date_diff('day', today(), field('Deadline')) < 0,
  'OVERDUE',
  concat(totext(date_diff('day', today(), field('Deadline'))), ' days left')
)
```

#### Pattern: Business Days Between Dates

**Goal:** Calculate working days between two dates (approximate).

**Formula:**
```
date_diff('day', field('Start Date'), field('End Date')) * 5 / 7
```

**Test Data:**
```json
{"Start Date": "2025-01-01", "End Date": "2025-01-15"}
```

**Expected Output:**
```
10  (approximately 10 business days)
```

### Numeric Calculations

#### Pattern: Discount Price

**Goal:** Calculate price after percentage discount.

**Formula:**
```
field('Price') * (1 - field('Discount Percent') / 100)
```

**Test Data:**
```json
{"Price": 100, "Discount Percent": 20}
```

**Expected Output:**
```
80
```

**Edge Cases:**
```json
{"Price": 100, "Discount Percent": 0}    → 100
{"Price": 100, "Discount Percent": 100}  → 0
{"Price": 100, "Discount Percent": 150}  → -50 (negative price!)
```

**Better Formula (prevent negative):**
```
if(
  field('Discount Percent') >= 100,
  0,
  field('Price') * (1 - field('Discount Percent') / 100)
)
```

#### Pattern: Tax Calculation

**Goal:** Add tax to subtotal.

**Formula:**
```
round(field('Subtotal') * (1 + field('Tax Rate') / 100), 2)
```

**Test Data:**
```json
{"Subtotal": 99.99, "Tax Rate": 8.5}
```

**Expected Output:**
```
108.49
```

### Conditional Logic

#### Pattern: Priority Assignment

**Goal:** Assign priority based on multiple conditions.

**Formula:**
```
if(
  field('Severity') = 'Critical',
  'P0',
  if(
    field('Severity') = 'High',
    'P1',
    if(field('Severity') = 'Medium', 'P2', 'P3')
  )
)
```

**Test Data:**
```json
{"Severity": "Critical"}  → "P0"
{"Severity": "High"}      → "P1"
{"Severity": "Medium"}    → "P2"
{"Severity": "Low"}       → "P3"
```

#### Pattern: Status Color Coding

**Goal:** Return color based on completion percentage.

**Formula:**
```
if(
  field('Completion') >= 100,
  '🟢 Complete',
  if(
    field('Completion') >= 50,
    '🟡 In Progress',
    '🔴 Not Started'
  )
)
```

**Test Data:**
```json
{"Completion": 100}  → "🟢 Complete"
{"Completion": 75}   → "🟡 In Progress"
{"Completion": 25}   → "🔴 Not Started"
```

### Cross-Field References

#### Pattern: Stock Status

**Goal:** Determine if item needs reordering.

**Formula:**
```
if(
  field('Current Stock') <= field('Reorder Level'),
  'ORDER NOW',
  if(
    field('Current Stock') <= field('Reorder Level') * 1.5,
    'Low Stock',
    'In Stock'
  )
)
```

**Test Data:**
```json
{"Current Stock": 10, "Reorder Level": 20}   → "ORDER NOW"
{"Current Stock": 25, "Reorder Level": 20}   → "Low Stock"
{"Current Stock": 50, "Reorder Level": 20}   → "In Stock"
```

## Error Handling

### Common Errors

#### 1. Field Reference Errors

**Error Message:**
```
Field 'Frist Name' does not exist
```

**Cause:** Typo in field name ('Frist' instead of 'First')

**Fix:**
- Check exact field name spelling and capitalization
- Verify field exists in the table
- Use `baserow_get_table` to see all field names

**Recovery:**
```json
{
  "tool": "baserow_update_field",
  "table_id": 123,
  "field_id": 456,
  "formula": "concat(field('First Name'), ' ', field('Last Name'))"
}
```

#### 2. Type Mismatch Errors

**Error Message:**
```
Argument 1 of CONCAT must be text but is number
```

**Cause:** Trying to concatenate a number without converting to text

**Fix:** Use `totext()` to convert numbers to text

**Before (fails):**
```
concat(field('Age'), ' years old')
```

**After (works):**
```
concat(totext(field('Age')), ' years old')
```

#### 3. Syntax Errors

**Error Message:**
```
Unexpected token at position 15
```

**Cause:** Missing parenthesis, quote, or comma

**Common syntax mistakes:**
```
concat(field('Name')                    # Missing closing )
field("Name")                           # Wrong quotes (use single quotes)
if(field('Age') > 18 'Adult', 'Minor')  # Missing comma
```

**Fix:** Carefully check formula syntax:
- Count opening and closing parentheses
- Use single quotes for strings
- Separate function arguments with commas

#### 4. Circular Dependency

**Error Message:**
```
Circular dependency detected: Field A → Field B → Field A
```

**Cause:** Formula field references another formula field that references back

**Example:**
```
Field A formula: field('B') + 1
Field B formula: field('A') + 1
```

**Fix:**
- Redesign formula logic to break the cycle
- Use a third field to store intermediate calculations
- Consider if both formulas are actually needed

### Error Recovery Strategies

**If field creation with formula fails:**
1. Field doesn't exist - safe to retry
2. Fix the error in your formula
3. Retry field creation with corrected formula

**If field update with formula fails:**
1. Field still exists with previous type/formula - no data loss
2. Review error message carefully
3. Fix formula and retry update
4. Original field remains unchanged until successful update

## Testing Your Formulas

### Verification Workflow

**1. Create Minimal Test Data**

Start with one simple, known case:

```json
{
  "tool": "baserow_create_row",
  "table_id": 123,
  "data": {"Price": 100, "Quantity": 2}
}
```

**2. List Rows to Check Output**

```json
{
  "tool": "baserow_list_rows",
  "table_id": 123
}
```

**3. Verify Calculation**

```
Expected: field('Total') should be 200
Actual: Check the 'Total' field in the response
Match? ✓ Proceed to edge cases
Mismatch? ✗ Debug formula
```

**4. Add Edge Case Test Data**

```json
{"Price": 0, "Quantity": 5}       // Zero price
{"Price": 100, "Quantity": 0}     // Zero quantity
{"Price": 1.99, "Quantity": 3}    // Decimals
{"Price": -50, "Quantity": 2}     // Negative (if applicable)
```

**5. Verify Edge Cases Behave Correctly**

- Do zeros produce zero total? ✓
- Do decimals round correctly? ✓
- Are negative values handled as expected? ✓

### Test Data Strategies

**Boundary Values:**
```json
{"Age": 0}          // Minimum
{"Age": 150}        // Maximum realistic
{"Age": -1}         // Invalid (test validation)
```

**Empty and Null:**
```json
{"Name": ""}        // Empty string
{}                  // Omit field (null)
```

**Type Extremes:**
```json
{"Number": 999999999999}        // Very large
{"Number": 0.0000001}           // Very small
{"Text": "A"}                   // Single character
{"Text": "Very long..."}        // Maximum length
```

**Date Ranges:**
```json
{"Date": "1900-01-01"}          // Far past
{"Date": "2100-12-31"}          // Far future
{"Date": "2025-02-29"}          // Invalid date (not leap year)
```

## MCP-Specific Considerations

### Using MCP Tools

**Tool: `baserow_create_field`**
```json
{
  "tool": "baserow_create_field",
  "table_id": 123,
  "type": "formula",
  "name": "Calculated Field",
  "formula": "field('A') + field('B')"
}
```

**⚠️ Risk:** If formula is invalid, entire field creation fails.

**Tool: `baserow_update_field`**
```json
{
  "tool": "baserow_update_field",
  "table_id": 123,
  "field_id": 456,
  "type": "formula",
  "formula": "field('A') + field('B')"
}
```

**✓ Safer:** Field exists; only formula update fails if invalid.

### Natural Language Workflow Examples

**Example 1: Creating Full Name Field**

**User:** "Add a full name field to the Users table"

**AI Agent Workflow:**
1. "Create a text field called 'Full Name' in the Users table"
   - Uses `baserow_create_field` with type: "text"
2. "Update the Full Name field to be a formula that combines First Name and Last Name"
   - Uses `baserow_update_field` with formula
3. "Show me the first 5 rows to verify"
   - Uses `baserow_list_rows` with size: 5
4. "Create a test row with empty first name to check edge case"
   - Uses `baserow_create_row`
5. "List rows again to verify edge case handling"
   - Uses `baserow_list_rows`

**Example 2: Age Calculation**

**User:** "Calculate age from birth date in the Customers table"

**AI Agent Workflow:**
1. "Create a number field called 'Age' in table ID 789"
2. "Update field to formula: date_diff('year', field('Birth Date'), today())"
3. "Add test customer with birth date 1990-01-01"
4. "List rows to check calculated age"
5. "Test with empty birth date"
6. "Verify null handling"

### Best Practices for AI Agents

**DO:**
- Always use the 5-step safe workflow
- Get table schema before creating formulas (`baserow_get_table`)
- Verify field names exactly match
- Create test data immediately after formula field
- Check results before declaring success

**DON'T:**
- Create formula fields directly without testing
- Assume field names (always verify)
- Skip edge case testing
- Ignore error messages (they're specific and helpful)
- Use complex formulas without breaking into steps

## Advanced Patterns

### Multi-Step Calculations

**Pattern: Profit Margin Percentage**

**Fields Needed:**
- Revenue (number)
- Costs (number)
- Profit (formula): `field('Revenue') - field('Costs')`
- Profit Margin (formula): See below

**Profit Margin Formula:**
```
if(
  field('Revenue') = 0,
  0,
  round((field('Profit') / field('Revenue')) * 100, 2)
)
```

**Why two formula fields?**
- Profit is reusable in other formulas
- Clearer logic and easier debugging
- Better error isolation

**Test Data:**
```json
{"Revenue": 1000, "Costs": 600}
// Profit should be: 400
// Profit Margin should be: 40.00
```

### Lookup Integration

**Pattern: Customer Lifetime Value**

**Scenario:** Calculate total orders from related table.

**Setup:**
- Customers table with link_row to Orders table
- Lookup field "Order Amounts" (gets amounts from linked orders)
- Formula field "Lifetime Value" (sums the amounts)

**Formula:**
```
sum(field('Order Amounts'))
```

**Note:** Lookup fields populate automatically from link_row relationships. The formula then aggregates the looked-up values.

**Test Data:**
1. Create customer
2. Link multiple orders to customer
3. Verify lookup shows all order amounts
4. Verify formula sums them correctly

## Troubleshooting Guide

### Debug Checklist

**When formula doesn't work:**

- [ ] Verify all referenced fields exist (`baserow_get_table`)
- [ ] Check field names match exactly (case-sensitive)
- [ ] Confirm field types are compatible with formula
- [ ] Test with simple data first (avoid edge cases initially)
- [ ] Check for circular dependencies
- [ ] Review error message carefully (it tells you exactly what's wrong)
- [ ] Test formula with minimal complexity first, then build up
- [ ] Verify syntax (count parentheses, check quotes)

### Debug Process

**Step 1: Isolate the Problem**

Simplify formula to smallest working version:

```
Original (fails):
concat(upper(field('First')), ' ', lower(field('Last')), ' (', totext(field('Age')), ')')

Test 1:
field('First')  // Does this work alone?

Test 2:
concat(field('First'), ' ', field('Last'))  // Basic concat?

Test 3:
concat(upper(field('First')), ' ', field('Last'))  // Add upper()?

... continue adding complexity until error appears
```

**Step 2: Check Field References**

```json
{
  "tool": "baserow_get_table",
  "table_id": 123,
  "include_fields": true
}
```

Verify:
- Field exists
- Field name spelling exact
- Field type is what you expect

**Step 3: Test Type Conversion**

If mixing types, ensure proper conversion:

```
Number to text: totext(field('Number'))
Text to number: tonumber(field('Text'))
Text to date: todate(field('Date String'), 'US')
Boolean to text: if(field('Boolean'), 'Yes', 'No')
```

**Step 4: Verify with Simple Test Data**

Create the absolute simplest possible test case:

```json
{"First": "A", "Last": "B", "Age": 1}
```

If this works, gradually add complexity to test data until you find what breaks it.

**Step 5: Review Baserow Documentation**

For function-specific syntax, consult:
- [Baserow Formula Documentation](https://baserow.io/docs/formulas)
- Check function signatures
- Review type requirements
- See official examples

### Common "Gotchas"

**1. Date Format Confusion**

```
todate('01/15/2025', 'US')   // MM/DD/YYYY
todate('15/01/2025', 'EU')   // DD/MM/YYYY
todate('2025-01-15', 'ISO')  // YYYY-MM-DD
```

**2. Empty String vs Null**

```
field('Name') = ''           // Checks for empty string
isblank(field('Name'))       // Checks for null or empty
```

**3. Division by Zero**

```
field('A') / field('B')      // Fails if B is 0

// Better:
if(field('B') = 0, 0, field('A') / field('B'))
```

**4. Text Concatenation with Numbers**

```
field('Count') + ' items'    // FAILS (number + text)
concat(totext(field('Count')), ' items')  // WORKS
```

## Additional Resources

**Official Documentation:**
- [Baserow Formula Fields](https://baserow.io/docs/formulas)
- [Baserow API Documentation](https://baserow.io/api-docs)

**Related MCP Guides:**
- [Formula Field Recipes](./formula-field-recipes.md) - Quick copy-paste patterns
- [Formula Testing Workflow](./formula-testing-workflow.md) - Step-by-step process guide
- [Basic Usage Examples](./basic-usage.md) - General MCP usage

**Need Help?**
- Check error messages carefully - they're specific and actionable
- Use the troubleshooting checklist above
- Test with minimal complexity first
- Review the recipes for similar patterns

---

**Remember: The safe workflow pattern is your friend!**

1. Create field as basic type
2. Update with formula
3. Create test data
4. Verify output
5. Test edge cases

This pattern catches errors early, enables iteration, and ensures robust formulas.
