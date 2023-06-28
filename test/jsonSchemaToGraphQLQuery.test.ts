import {jsonSchemaToGraphQLQuery} from "../src/jsonSchemaToGraphQLQuery";
import {JSONSchema7} from "json-schema";

const schema: JSONSchema7 = {
  '$schema': 'http://json-schema.org/draft-07/schema#',
  '$id': 'https://example.com/person.schema.json',
  'title': 'Person',
  'description': 'A human being',
  'type': 'object',
  'required': ['name', 'father'],
  'properties': {
    'name': {
      'type': 'string'
    },
    'knows': {
      'type': 'array',
      'items': {
        'required': ['nick'],
        'properties': {
          'nick': {'type': 'string'},
        }
      }
    },
    'father': {
      'type': 'object',
      'properties': {
        'name': {'type': 'string'},
        'description': {'type': 'string'}
      }
    }
  }
}
describe('graphql list queries', () => {
  it('can be generated out of basic json schema', () => {
    const graphqlQuery = jsonSchemaToGraphQLQuery('Person', schema)
    expect(graphqlQuery).toEqual(

`query getPerson( $pk: ID! ) {
      getPerson(pk: $pk) {
      	name
	knows { 
	    	nick
		id 
	  }
	father { 
	    	name
		description
		id 
	  }
	id
      }
    }`);

  });
});
