import { JSONSchema7 } from 'json-schema';
import { isObject } from 'lodash';

import { filterUndefOrNull } from './filterUndefOrNull';
import { JsonSchema, resolveSchema } from '@graviola/json-schema-core';

export type GraphQLMappingOptions = {
  list?: boolean;
  additionalFields?: string[];
  input?: any;
  propertyBlacklist?: string[];
  maxRecursion?: number;
};

const makeProperty = (key: string, propertyString?: string) => {
  if (!propertyString || propertyString.length === 0) return undefined;
  return `${key} { 
    ${propertyString} 
  }`;
};

type JsonSchemaPropertiesToGraphQLQuery = (
  rootProperty: JSONSchema7['properties'],
  rootSchema: JSONSchema7,
  options?: GraphQLMappingOptions,
  level?: number
) => undefined | string;
export const jsonSchemaPropertiesToGraphQLQuery: JsonSchemaPropertiesToGraphQLQuery = (
  rootProperty,
  rootSchema,
  options,
  level = 0
) => {
  if (level > (options?.maxRecursion ?? 1)) return undefined;
  const propertiesList = [
      ...(options?.additionalFields || []),
      ...filterUndefOrNull(
    Object.entries(rootProperty || {}).map(([key, p]) => {
      if (
        options?.propertyBlacklist?.includes(key) ||
        key.startsWith('@') ||
        !isObject(p)
      )
        return undefined;
      if (p.type === 'string' || p.type === 'number' || p.type === 'boolean') {
        return key;
      }
      if (p.type === 'object' || p.$ref) {
        let properties = p.properties;
        if (p.$ref) {
          const subSchema = resolveSchema(
            p as JsonSchema,
            '',
            rootSchema as JsonSchema
          ) as JSONSchema7;
          if (subSchema && subSchema.properties) {
            properties = subSchema.properties;
          }
        }
        if (properties)
          return makeProperty(
            key,
            jsonSchemaPropertiesToGraphQLQuery(
              properties,
              rootSchema,
              options,
              level + 1
            )
          );
      }
      if (p.type === 'array' && isObject(p.items)) {
        const items = p.items as JSONSchema7;
        let properties = items.properties;
        if (items.$ref) {
          const subSchema = resolveSchema(
            p.items as JsonSchema,
            '',
            rootSchema as JsonSchema
          ) as JSONSchema7;
          if (subSchema && subSchema.properties) {
            properties = subSchema.properties;
          }
        }
        if (properties)
          return makeProperty(
            key,
            jsonSchemaPropertiesToGraphQLQuery(
              properties,
              rootSchema,
              options,
              level + 1
            )
          );
      }
      return undefined;
    }))
  ]
  if (propertiesList.length === 0) return '';
  //prepend tabs at the beginning of each (amount of tabs = level)
  return propertiesList
    .map(p =>
      p
        ?.split('\n')
        .map(l => `\t${l}`)
        .join('\n')
    )
    .join('\n');
};
export const jsonSchemaToGraphQLQuery = (
  entityType: string,
  schema: JSONSchema7,
  options?: GraphQLMappingOptions
) => {
  const queryName = `get${entityType}${options?.list ? 'List' : ''}`;

  const properties = jsonSchemaPropertiesToGraphQLQuery(
    schema.properties,
    schema,
    options
  );

  const dict2Input: (dict: Record<string, any>, curvedBrackets?: boolean) => string = (dict: Record<string, any>, curvedBrackets) => {
    const openBrackets = !curvedBrackets ? '{' : '(';
    const closeBrackets = !curvedBrackets ? '}' : ')';
    //TODO: handle arrays
    return dict ? openBrackets + Object.entries(dict)
        .filter(([, value]) => typeof value !== 'undefined' && value !== null)
        .map(([key, value]) => `${key}: ${typeof value === 'object' ? ` ${dict2Input(value as Record<string, any>,)} ` : value}`)
        .join(', ') + closeBrackets : '';
  };

  return options?.list
    ? `query ${queryName} {
      ${queryName}${dict2Input(options.input, true)} {
      ${properties}
      }
    }`
    : `query ${queryName}( $pk: ID! ) {
      ${queryName}(pk: $pk) {
      ${properties}
      }
    }`;
};
