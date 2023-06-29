import { jsonSchemaToGraphQLQuery } from '../src/jsonSchemaToGraphQLQuery';
import { JSONSchema7 } from 'json-schema';
import * as fs from "fs";

const schema: JSONSchema7 = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://example.com/person.schema.json',
  title: 'Person',
  description: 'A human being',
  type: 'object',
  required: ['name', 'likesProduct'],
  properties: {
    name: {
      type: 'string',
    },
    likesProduct: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
      },
    },
  },
};

const schemaWithNestedObjectStub = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://example.com/person.schema.json',
  $defs: {
    person: {
      type: 'object',
      title: 'Person',
      description: 'A human being',
      required: ['name', 'knows'],
      properties: {
        name: {
          type: 'string',
        },
        knows: {
          type: 'array',
          items: {
            $ref: '#/$defs/person',
          },
        },
      },
    },
  },
};

const schemaWithNestedObject = {
  ...schemaWithNestedObjectStub,
  ...schemaWithNestedObjectStub.$defs.person,
} as JSONSchema7;
describe('graphql list queries', () => {
  it('can be generated out of basic json schema', () => {
    const graphqlQuery = jsonSchemaToGraphQLQuery('Person', schema);
    expect(graphqlQuery).toEqual(
      `query getPerson( $pk: ID! ) {
      getPerson(pk: $pk) {
      	name
	likesProduct { 
	    	name
		description 
	  }
      }
    }`
    );
  });
  it('can be generated out of schema with nested object', () => {
    const graphqlQuery = jsonSchemaToGraphQLQuery(
      'Person',
      schemaWithNestedObject
    );
    expect(graphqlQuery).toEqual(
      `query getPerson( $pk: ID! ) {
      getPerson(pk: $pk) {
      	name
	knows { 
	    	name 
	  }
      }
    }`
    );
  });
  it('can be generated out ofschema with nested object and maxRecursion 3', () => {
    const graphqlQuery = jsonSchemaToGraphQLQuery(
      'Person',
      schemaWithNestedObject,
      { maxRecursion: 3 }
    );
    fs.writeFileSync('test.graphql', graphqlQuery, 'utf-8');
    expect(graphqlQuery).toEqual(
      `query getPerson( $pk: ID! ) {
      getPerson(pk: $pk) {
      	name
	knows { 
	    	name
		knows { 
		    	name
			knows { 
			    	name 
			  } 
		  } 
	  }
      }
    }`
    );
  });

  it('with additional fields', () => {
    const graphqlQuery = jsonSchemaToGraphQLQuery(
        'Person',
        schemaWithNestedObject,
        {
          maxRecursion: 3,
          additionalFields: [ 'id', '__typename' ]
        }
    );
    fs.writeFileSync('test.graphql', graphqlQuery, 'utf-8');
    expect(graphqlQuery).toEqual(
        `query getPerson( $pk: ID! ) {
      getPerson(pk: $pk) {
      	id
	__typename
	name
	knows { 
	    	id
		__typename
		name
		knows { 
		    	id
			__typename
			name
			knows { 
			    	id
				__typename
				name 
			  } 
		  } 
	  }
      }
    }`
    );
  });
});
