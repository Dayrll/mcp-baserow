# Formula Field Testing Workflow

A step-by-step guide for safely developing, testing, and deploying Baserow formula fields using the MCP service.

## Quick Start Checklist

**Before you start:**
- [ ] Know which table you're working with (table ID)
- [ ] Identify source fields your formula needs
- [ ] Have a clear goal for what the formula should calculate

**The 5-step workflow:**
1. [ ] Create field as basic type (text/number)
2. [ ] Update field with formula expression
3. [ ] Create test data with known values
4. [ ] Verify formula output matches expected
5. [ ] Test edge cases (null, empty, zero)

**Success criteria:**
- [ ] Formula compiles without errors
- [ ] Normal cases produce correct results
- [ ] Edge cases handled gracefully
- [ ] No unexpected null or error values

## Detailed Workflow

### Phase 1: Preparation

**Objective:** Understand requirements and plan your formula before writing any code.

#### 1.1 Identify Your Needs

**Questions to answer:**
- What should this formula calculate?
- Which existing fields does it need?
- What should the output type be (text, number, boolean)?
- What edge cases might exist?

**Example:**
```
Goal: Calculate total price including tax
Source fields: "Subtotal" (number), "Tax Rate" (number)
Output type: Number (rounded to 2 decimals)
Edge cases: Zero subtotal, very high tax rates, negative values
```

#### 1.2 List Required Fields

**Get table schema to see all available fields:**

**Natural language:**
> "Show me all fields in table 123"

**Direct tool call:**
```json
{
  "tool": "baserow_get_table",
  "table_id": 123,
  "include_fields": true
}
```

**Verify:**
- [ ] All needed source fields exist
- [ ] Field names are spelled exactly as shown
- [ ] Field types are compatible with your formula
- [ ] No circular dependencies will be created

#### 1.3 Plan Your Formula

**Write out the logic in plain language first:**

```
IF subtotal is 0:
  RETURN 0
ELSE:
  RETURN subtotal * (1 + tax_rate / 100), rounded to 2 decimals
```

**Then translate to Baserow formula syntax:**

```
if(
  field('Subtotal') = 0,
  0,
  round(field('Subtotal') * (1 + field('Tax Rate') / 100), 2)
)
```

**Tip:** Start simple, add complexity incrementally.

### Phase 2: Field Creation

**Objective:** Create the field safely so it exists even if formula validation fails.

#### 2.1 Create as Basic Type

**Choose the right basic type:**
- **Text**: If formula output will be text or you're unsure
- **Number**: If formula will definitely output numbers
- **Boolean**: Rarely used as initial type

**Natural language:**
> "Create a number field called 'Total with Tax' in table 123"

**Direct tool call:**
```json
{
  "tool": "baserow_create_field",
  "table_id": 123,
  "type": "number",
  "name": "Total with Tax",
  "number_decimal_places": 2
}
```

**Expected response:**
```json
{
  "id": 456,
  "name": "Total with Tax",
  "type": "number",
  ...
}
```

**Save the field ID (456) - you'll need it for the next step!**

#### 2.2 Verify Field Exists

**Quick check:**

**Natural language:**
> "Show me the schema for table 123"

**Verify:**
- [ ] Field appears in field list
- [ ] Field name is correct
- [ ] Field ID is noted (e.g., 456)

### Phase 3: Formula Application

**Objective:** Update the field to use your formula, with graceful error handling.

#### 3.1 Update Field with Formula

**Natural language:**
> "Update field 456 in table 123 to be a formula field with formula: if(field('Subtotal') = 0, 0, round(field('Subtotal') * (1 + field('Tax Rate') / 100), 2))"

**Direct tool call:**
```json
{
  "tool": "baserow_update_field",
  "table_id": 123,
  "field_id": 456,
  "type": "formula",
  "formula": "if(field('Subtotal') = 0, 0, round(field('Subtotal') * (1 + field('Tax Rate') / 100), 2))"
}
```

#### 3.2 Handle Errors

**If successful:**
```json
{
  "id": 456,
  "name": "Total with Tax",
  "type": "formula",
  "formula": "if(field('Subtotal') = 0, ...)",
  ...
}
```
→ Proceed to Phase 4

**If error occurs:**
```json
{
  "error": "Field 'Tax Rate' does not exist"
}
```

**Error handling steps:**

1. **Read the error message carefully** - it tells you exactly what's wrong

2. **Common error types and fixes:**

   **Field not found:**
   ```
   Error: "Field 'Tax Rate' does not exist"
   Fix: Check field name spelling, use baserow_get_table to verify exact name
   ```

   **Type mismatch:**
   ```
   Error: "Argument 1 must be text but is number"
   Fix: Use totext() to convert: totext(field('Number'))
   ```

   **Syntax error:**
   ```
   Error: "Unexpected token at position 25"
   Fix: Check parentheses, quotes, commas
   ```

3. **Fix the formula**

4. **Retry the update** (field still exists with previous type)

5. **Repeat until successful**

### Phase 4: Test Data Creation

**Objective:** Create rows with known values to verify formula correctness.

#### 4.1 Create Simple Test Case

**Start with one straightforward case with known expected output:**

**Natural language:**
> "Create a row in table 123 with Subtotal 100 and Tax Rate 10"

**Direct tool call:**
```json
{
  "tool": "baserow_create_row",
  "table_id": 123,
  "data": {
    "Subtotal": 100,
    "Tax Rate": 10
  }
}
```

**Calculate expected output manually:**
```
100 * (1 + 10/100) = 100 * 1.10 = 110.00
```

**Expected formula output: 110.00**

#### 4.2 Create Edge Case Test Data

**Create rows testing boundary conditions:**

**Zero subtotal:**
```json
{
  "tool": "baserow_create_row",
  "table_id": 123,
  "data": {
    "Subtotal": 0,
    "Tax Rate": 10
  }
}
// Expected output: 0
```

**Zero tax:**
```json
{
  "data": {
    "Subtotal": 100,
    "Tax Rate": 0
  }
}
// Expected output: 100.00
```

**High tax rate:**
```json
{
  "data": {
    "Subtotal": 100,
    "Tax Rate": 100
  }
}
// Expected output: 200.00
```

**Decimal values:**
```json
{
  "data": {
    "Subtotal": 99.99,
    "Tax Rate": 8.5
  }
}
// Expected output: 108.49
```

**Empty/null values (omit fields):**
```json
{
  "data": {}
}
// Expected output: Check how formula handles null
```

### Phase 5: Verification

**Objective:** Confirm formula produces correct results for all test cases.

#### 5.1 List Rows to Check Output

**Natural language:**
> "Show me all rows from table 123"

**Direct tool call:**
```json
{
  "tool": "baserow_list_rows",
  "table_id": 123
}
```

**Expected response:**
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "Subtotal": 100,
      "Tax Rate": 10,
      "Total with Tax": 110.00
    },
    {
      "id": 2,
      "Subtotal": 0,
      "Tax Rate": 10,
      "Total with Tax": 0
    },
    ...
  ]
}
```

#### 5.2 Compare Expected vs Actual

**Create a verification table:**

| Row | Subtotal | Tax Rate | Expected | Actual | Match? |
|-----|----------|----------|----------|--------|--------|
| 1   | 100      | 10       | 110.00   | 110.00 | ✓      |
| 2   | 0        | 10       | 0        | 0      | ✓      |
| 3   | 100      | 0        | 100.00   | 100.00 | ✓      |
| 4   | 100      | 100      | 200.00   | 200.00 | ✓      |
| 5   | 99.99    | 8.5      | 108.49   | 108.49 | ✓      |

**If all match:** ✓ Success! Proceed to Phase 6 for final edge cases

**If mismatches exist:**
1. Identify which test case failed
2. Debug the formula logic for that case
3. Update formula (Phase 3)
4. Re-verify (Phase 5)

#### 5.3 Check for Unexpected Behaviors

**Look for:**
- [ ] Null values where you expected numbers
- [ ] Error messages in formula field
- [ ] Unexpected rounding or precision issues
- [ ] Type coercion problems (numbers as strings, etc.)
- [ ] Missing values

### Phase 6: Iteration

**Objective:** Fix any issues and refine formula based on test results.

#### 6.1 Fix Issues Found in Testing

**Example issue: Null handling**

**Problem:**
```
When Subtotal is null, formula returns error instead of 0
```

**Current formula:**
```
if(
  field('Subtotal') = 0,
  0,
  round(field('Subtotal') * (1 + field('Tax Rate') / 100), 2)
)
```

**Fixed formula:**
```
if(
  isblank(field('Subtotal')) OR field('Subtotal') = 0,
  0,
  round(field('Subtotal') * (1 + field('Tax Rate') / 100), 2)
)
```

**Update field with fix:**
```json
{
  "tool": "baserow_update_field",
  "table_id": 123,
  "field_id": 456,
  "formula": "if(isblank(field('Subtotal')) OR field('Subtotal') = 0, 0, round(field('Subtotal') * (1 + field('Tax Rate') / 100), 2))"
}
```

#### 6.2 Retest After Changes

**After each formula update:**
1. List rows again to see new calculated values
2. Verify the fix worked for the problem case
3. Ensure fix didn't break other cases
4. Add new test data if needed

#### 6.3 Document Your Formula

**Once working correctly, document:**

**Formula purpose:**
```
Calculates total price including tax, with proper null handling
```

**Formula:**
```
if(
  isblank(field('Subtotal')) OR field('Subtotal') = 0,
  0,
  round(field('Subtotal') * (1 + field('Tax Rate') / 100), 2)
)
```

**Known edge cases:**
- Null/empty subtotal → returns 0
- Zero subtotal → returns 0
- Negative tax rates → allows (consider if this should be blocked)
- Very large numbers → may hit precision limits

## Real-World Example: Customer Status Field

**Goal:** Create a status field showing customer tier based on total purchases and account age.

### Preparation

**Requirements:**
- Gold: Total purchases > $1000 AND account age > 1 year
- Silver: Total purchases > $500 OR account age > 1 year
- Bronze: Everyone else

**Source fields needed:**
- Total Purchases (number)
- Account Created (date)

**Output type:** Text

### Implementation

**Step 1: Create field**
```json
{
  "tool": "baserow_create_field",
  "table_id": 100,
  "type": "text",
  "name": "Customer Tier"
}
// Result: field_id 200
```

**Step 2: Update with formula**
```json
{
  "tool": "baserow_update_field",
  "table_id": 100,
  "field_id": 200,
  "type": "formula",
  "formula": "if(AND(field('Total Purchases') > 1000, date_diff('year', field('Account Created'), today()) > 1), 'Gold', if(OR(field('Total Purchases') > 500, date_diff('year', field('Account Created'), today()) > 1), 'Silver', 'Bronze'))"
}
```

**Step 3: Create test data**
```json
// Gold customer
{"Total Purchases": 1500, "Account Created": "2020-01-01"}

// Silver (high purchases, new account)
{"Total Purchases": 800, "Account Created": "2024-06-01"}

// Silver (low purchases, old account)
{"Total Purchases": 200, "Account Created": "2020-01-01"}

// Bronze
{"Total Purchases": 100, "Account Created": "2024-06-01"}
```

**Step 4: Verify**
```json
{
  "tool": "baserow_list_rows",
  "table_id": 100
}
```

**Expected results:**
| Purchases | Account Age | Expected Tier |
|-----------|-------------|---------------|
| 1500      | 5 years     | Gold          |
| 800       | 6 months    | Silver        |
| 200       | 5 years     | Silver        |
| 100       | 6 months    | Bronze        |

**Step 5: Test edge cases**
```json
// Exactly at threshold
{"Total Purchases": 1000, "Account Created": "2024-01-01"}
// Expected: Silver (not > 1000)

// Null purchases
{"Account Created": "2020-01-01"}
// Expected: Check behavior (might error - needs fix)

// Future account created (data error)
{"Total Purchases": 500, "Account Created": "2026-01-01"}
// Expected: Negative age - needs handling
```

**Step 6: Fix edge cases**

Updated formula with null handling:
```
if(
  isblank(field('Total Purchases')),
  'Bronze',
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
)
```

## Common Pitfalls

### 1. Creating Formula Field Directly

**❌ Don't do this:**
```json
{
  "tool": "baserow_create_field",
  "type": "formula",
  "formula": "field('Doesnt Exist')"
}
```
**Problem:** If formula fails, field doesn't exist - no recovery

**✓ Do this instead:**
```json
// Step 1: Create as text
{
  "tool": "baserow_create_field",
  "type": "text",
  "name": "My Field"
}

// Step 2: Update to formula
{
  "tool": "baserow_update_field",
  "field_id": 123,
  "type": "formula",
  "formula": "..."
}
```
**Benefit:** Field exists; can retry formula update safely

### 2. Skipping Test Data

**❌ Don't assume it works:**
```
"Formula compiled successfully" ≠ "Formula produces correct results"
```

**✓ Always verify with actual data:**
- Create test rows
- List rows to see calculated values
- Compare to manually calculated expected values

### 3. Ignoring Edge Cases

**❌ Only testing happy path:**
```json
{"Price": 100, "Quantity": 2}  // Works!
```

**✓ Test boundary conditions:**
```json
{"Price": 0, "Quantity": 2}      // Zero price
{"Price": 100, "Quantity": 0}    // Zero quantity
{}                               // Null values
{"Price": -50, "Quantity": 2}    // Negative values
```

### 4. Complex Formulas Without Testing Steps

**❌ Building entire complex formula at once:**
```
concat(upper(field('First')), ' ', lower(field('Last')), ' (Age: ', totext(field('Age')), ')')
```
If this fails, hard to debug where the problem is.

**✓ Build incrementally:**
```
Step 1: field('First')
Step 2: concat(field('First'), ' ', field('Last'))
Step 3: concat(upper(field('First')), ' ', field('Last'))
Step 4: ... add complexity gradually
```

### 5. Not Reading Error Messages

**❌ Seeing error, guessing at fix:**
```
"It's not working... maybe I'll try different syntax?"
```

**✓ Read error carefully - it tells you exactly what's wrong:**
```
Error: "Field 'Frist Name' does not exist"
→ Fix: Change 'Frist Name' to 'First Name'

Error: "Argument 1 must be text but is number"
→ Fix: Use totext(field('Number'))
```

## AI Agent Tips

### Natural Language Prompts

**Effective prompts for AI agents:**

**Good:**
> "Create a formula field in table 123 that calculates the full name. Use the safe workflow: create as text first, then update with the formula concat(field('First Name'), ' ', field('Last Name')). Add test data and verify it works."

**Why good:**
- Specifies table ID
- Mentions safe workflow
- Provides exact formula
- Requests testing

**Less effective:**
> "Add a full name field"

**Why less effective:**
- Doesn't specify workflow
- No mention of testing
- AI might create formula field directly

### Verification Strategies

**After AI creates formula, verify:**

1. **Check field exists:**
   > "Show me the fields in table 123"

2. **Verify formula syntax:**
   > "What's the formula for field 456?"

3. **Request test data:**
   > "Create test rows with edge cases"

4. **Review results:**
   > "Show me all rows and check if the formula output is correct"

### Iterative Refinement

**Work with AI in small steps:**

```
You: "Create a text field called 'Status'"
AI: [Creates field, returns ID 789]

You: "Update field 789 to formula: if(field('Active'), 'Active', 'Inactive')"
AI: [Updates field]

You: "Add test row with Active = true"
AI: [Creates row]

You: "Show the row to verify Status shows 'Active'"
AI: [Lists rows, confirms]

You: "Now test with Active = false"
AI: [Creates another test row]
```

## Debugging Decision Tree

```
Formula not working?
│
├─ Did field get created?
│  ├─ NO → Check table_id, use baserow_create_field
│  └─ YES → Continue
│
├─ Did formula update succeed?
│  ├─ NO → Read error message
│  │      ├─ "Field not found" → Check spelling with baserow_get_table
│  │      ├─ "Type mismatch" → Add type conversion (totext, tonumber)
│  │      └─ "Syntax error" → Check parentheses, quotes, commas
│  └─ YES → Continue
│
├─ Does formula produce values?
│  ├─ NO (shows null/blank) → Check if source fields have data
│  │                        → Verify field references are correct
│  │                        → Add null handling: isblank()
│  └─ YES → Continue
│
├─ Are values correct for normal cases?
│  ├─ NO → Debug formula logic
│  │      └─ Simplify formula, test incrementally
│  └─ YES → Continue
│
└─ Do edge cases work?
   ├─ NO → Add conditional handling for edge cases
   │      └─ if(isblank(...), default_value, calculation)
   └─ YES → SUCCESS! Formula is complete and robust
```

## Summary

**The safe workflow is:**
1. **Create** field as basic type (text/number)
2. **Update** field with formula
3. **Test** with simple known data
4. **Verify** output matches expected
5. **Edge test** with null, zero, boundary values

**Key principles:**
- Field exists even if formula fails
- Error messages are specific and actionable
- Test data proves correctness
- Iteration is expected and safe
- Edge cases prevent production issues

**Next steps:**
- See [Formula Fields Guide](./formula-fields-guide.md) for comprehensive formula syntax
- Check [Formula Field Recipes](./formula-field-recipes.md) for copy-paste patterns
- Review [Basic Usage](./basic-usage.md) for general MCP examples

---

**Remember:** Formula development is iterative. Start simple, test frequently, and build complexity gradually. The safe workflow pattern ensures you can always recover from errors and refine your formulas with confidence.
