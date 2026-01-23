import { BaserowClient } from '../baserow-client.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function getFieldToolSchemas(): Tool[] {
  return [
    {
      name: 'baserow_create_field',
      description: 'Create a new field in a table. Supports various field types with default values and constraints.',
      inputSchema: {
        type: 'object',
        properties: {
          table_id: {
            type: 'number',
            description: 'The ID of the table to create the field in'
          },
          type: {
            type: 'string',
            description: 'Field type. Common types: text, number, boolean, date, link_row, lookup, single_select, multiple_select, formula, url, email, file, count, rollup',
            enum: ['text', 'number', 'boolean', 'date', 'link_row', 'lookup', 'single_select', 'multiple_select', 'formula', 'url', 'email', 'file', 'count', 'rollup']
          },
          name: {
            type: 'string',
            description: 'Name of the new field'
          },
          description: {
            type: 'string',
            description: 'Optional description of the field'
          },
          primary: {
            type: 'boolean',
            description: 'Whether this field should be the primary field (one per table)'
          },
          text_default: {
            type: 'string',
            description: 'Default value for text fields'
          },
          boolean_default: {
            type: 'boolean',
            description: 'Default value for boolean fields'
          },
          number_default: {
            type: 'number',
            description: 'Default value for number fields'
          },
          number_decimal_places: {
            type: 'number',
            description: 'Number of decimal places for number fields (0-5)'
          },
          number_negative: {
            type: 'boolean',
            description: 'Whether negative numbers are allowed for number fields'
          },
          number_prefix: {
            type: 'string',
            description: 'Prefix for number fields (e.g., "$")'
          },
          number_suffix: {
            type: 'string',
            description: 'Suffix for number fields (e.g., "%")'
          },
          number_separator: {
            type: 'string',
            description: 'Number separator: "" (none), "," (comma), or "." (period)'
          },
          date_format: {
            type: 'string',
            description: 'Date format for date fields: "US" (MM/DD/YYYY) or "EU" (DD/MM/YYYY)'
          },
          date_include_time: {
            type: 'boolean',
            description: 'Whether to include time for date fields'
          },
          date_time_format: {
            type: 'string',
            description: 'Time format for date fields: "12" or "24"'
          },
          date_show_tzinfo: {
            type: 'boolean',
            description: 'Whether to show timezone info for date fields'
          },
          date_force_timezone: {
            type: 'string',
            description: 'Force specific timezone (e.g., "UTC", "America/New_York")'
          },
          select_options: {
            type: 'array',
            description: 'Options for single_select or multiple_select fields',
            items: {
              type: 'object',
              properties: {
                value: { type: 'string' },
                color: { type: 'string' }
              },
              required: ['value', 'color']
            }
          },
          link_row_table_id: {
            type: 'number',
            description: 'Target table ID for link_row fields'
          },
          link_row_has_related_field: {
            type: 'boolean',
            description: 'Whether link_row field has a related field'
          },
          through_field_id: {
            type: 'number',
            description: 'Through field ID for lookup fields'
          },
          target_field_id: {
            type: 'number',
            description: 'Target field ID for lookup fields'
          },
          formula: {
            type: 'string',
            description: 'Formula expression for formula fields'
          },
          unique: {
            type: 'boolean',
            description: 'Whether the field should have a unique constraint'
          }
        },
        required: ['table_id', 'type', 'name']
      }
    },
    {
      name: 'baserow_update_field',
      description: 'Update an existing field in a table. You can change field type, name, description, or other properties.',
      inputSchema: {
        type: 'object',
        properties: {
          table_id: {
            type: 'number',
            description: 'The ID of the table containing the field'
          },
          field_id: {
            type: 'number',
            description: 'The ID of the field to update'
          },
          type: {
            type: 'string',
            description: 'New field type (if changing type)'
          },
          name: {
            type: 'string',
            description: 'New name for the field'
          },
          description: {
            type: 'string',
            description: 'New description for the field'
          },
          unique: {
            type: 'boolean',
            description: 'Whether the field should have a unique constraint'
          },
          text_default: {
            type: 'string',
            description: 'Default value for text fields'
          },
          boolean_default: {
            type: 'boolean',
            description: 'Default value for boolean fields'
          },
          number_default: {
            type: 'number',
            description: 'Default value for number fields'
          },
          number_decimal_places: {
            type: 'number',
            description: 'Number of decimal places for number fields (0-5)'
          },
          number_negative: {
            type: 'boolean',
            description: 'Whether negative numbers are allowed for number fields'
          },
          number_prefix: {
            type: 'string',
            description: 'Prefix for number fields (e.g., "$")'
          },
          number_suffix: {
            type: 'string',
            description: 'Suffix for number fields (e.g., "%")'
          },
          number_separator: {
            type: 'string',
            description: 'Number separator: "" (none), "," (comma), or "." (period)'
          },
          date_format: {
            type: 'string',
            description: 'Date format for date fields: "US" (MM/DD/YYYY) or "EU" (DD/MM/YYYY)'
          },
          date_include_time: {
            type: 'boolean',
            description: 'Whether to include time for date fields'
          },
          date_time_format: {
            type: 'string',
            description: 'Time format for date fields: "12" or "24"'
          },
          date_show_tzinfo: {
            type: 'boolean',
            description: 'Whether to show timezone info for date fields'
          },
          date_force_timezone: {
            type: 'string',
            description: 'Force specific timezone (e.g., "UTC", "America/New_York")'
          },
          select_options: {
            type: 'array',
            description: 'Options for single_select or multiple_select fields',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                value: { type: 'string' },
                color: { type: 'string' }
              },
              required: ['value', 'color']
            }
          },
          formula: {
            type: 'string',
            description: 'Formula expression for formula fields'
          }
        },
        required: ['table_id', 'field_id']
      }
    },
    {
      name: 'baserow_delete_field',
      description: 'Delete a field from a table. This action cannot be undone.',
      inputSchema: {
        type: 'object',
        properties: {
          table_id: {
            type: 'number',
            description: 'The ID of the table containing the field'
          },
          field_id: {
            type: 'number',
            description: 'The ID of the field to delete'
          }
        },
        required: ['table_id', 'field_id']
      }
    }
  ];
}

export async function handleFieldTools(
  client: BaserowClient,
  toolName: string,
  args: any
): Promise<{ content: Array<{ type: string; text: string }> }> {
  let result: any;

  switch (toolName) {
    case 'baserow_create_field':
      if (!args?.table_id || !args?.type || !args?.name) {
        throw new Error('table_id, type, and name are required');
      }
      
      const createParams = {
        table_id: args.table_id,
        type: args.type,
        name: args.name,
        description: args.description,
        primary: args.primary,
        text_default: args.text_default,
        boolean_default: args.boolean_default,
        number_default: args.number_default,
        number_decimal_places: args.number_decimal_places,
        number_negative: args.number_negative,
        number_prefix: args.number_prefix,
        number_suffix: args.number_suffix,
        number_separator: args.number_separator,
        date_format: args.date_format,
        date_include_time: args.date_include_time,
        date_time_format: args.date_time_format,
        date_show_tzinfo: args.date_show_tzinfo,
        date_force_timezone: args.date_force_timezone,
        select_options: args.select_options,
        link_row_table_id: args.link_row_table_id,
        link_row_has_related_field: args.link_row_has_related_field,
        through_field_id: args.through_field_id,
        target_field_id: args.target_field_id,
        formula: args.formula,
        unique: args.unique
      };
      
      result = await client.createField(createParams);
      break;

    case 'baserow_update_field':
      if (!args?.table_id || !args?.field_id) {
        throw new Error('table_id and field_id are required');
      }
      
      const updateParams: any = {
        table_id: args.table_id,
        field_id: args.field_id
      };
      
      if (args.type !== undefined) updateParams.type = args.type;
      if (args.name !== undefined) updateParams.name = args.name;
      if (args.description !== undefined) updateParams.description = args.description;
      if (args.unique !== undefined) updateParams.unique = args.unique;
      if (args.text_default !== undefined) updateParams.text_default = args.text_default;
      if (args.boolean_default !== undefined) updateParams.boolean_default = args.boolean_default;
      if (args.number_default !== undefined) updateParams.number_default = args.number_default;
      if (args.number_decimal_places !== undefined) updateParams.number_decimal_places = args.number_decimal_places;
      if (args.number_negative !== undefined) updateParams.number_negative = args.number_negative;
      if (args.number_prefix !== undefined) updateParams.number_prefix = args.number_prefix;
      if (args.number_suffix !== undefined) updateParams.number_suffix = args.number_suffix;
      if (args.number_separator !== undefined) updateParams.number_separator = args.number_separator;
      if (args.date_format !== undefined) updateParams.date_format = args.date_format;
      if (args.date_include_time !== undefined) updateParams.date_include_time = args.date_include_time;
      if (args.date_time_format !== undefined) updateParams.date_time_format = args.date_time_format;
      if (args.date_show_tzinfo !== undefined) updateParams.date_show_tzinfo = args.date_show_tzinfo;
      if (args.date_force_timezone !== undefined) updateParams.date_force_timezone = args.date_force_timezone;
      if (args.select_options !== undefined) updateParams.select_options = args.select_options;
      if (args.formula !== undefined) updateParams.formula = args.formula;
      
      result = await client.updateField(updateParams);
      break;

    case 'baserow_delete_field':
      if (!args?.table_id || !args?.field_id) {
        throw new Error('table_id and field_id are required');
      }
      await client.deleteField(args.table_id, args.field_id);
      result = { 
        success: true, 
        message: `Field ${args.field_id} deleted from table ${args.table_id}` 
      };
      break;

    default:
      throw new Error(`Unknown field tool: ${toolName}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }
    ]
  };
}