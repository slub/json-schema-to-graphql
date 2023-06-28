<h1 align="center">json-schema-to-graphql</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-0.1.0-blue.svg?cacheSeconds=2592000" />
  <img src="https://img.shields.io/badge/node-%3E%3D10-blue.svg" />
  <a href="#" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
</p>

create graphql queries and mutations based on a given JSON-Schema

## Prerequisites

- node >=10

## Install

```sh
yarn add @slub/json-schema-to-graphql
```

## Usage

given the following json schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://example.com/person.schema.json",
  "$defs": {
    "person": {
      "type": "object",
      "title": "Person",
      "description": "A human being",
      "required": [
        "name",
        "knows"
      ],
      "properties": {
        "name": {
          "type": "string"
        },
        "knows": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/person"
          }
        }
      }
    }
  },
  "type": "object",
  "title": "Person",
  "description": "A human being",
  "required": [
    "name",
    "knows"
  ],
  "properties": {
    "name": {
      "type": "string"
    },
    "knows": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/person"
      }
    }
  }
}
```

you can create a graphql query and mutation like this

```js
jsonSchemaToGraphQLQuery('Person', schema, { maxRecursion: 3 })
```

to get the following query

```graphql
query getPerson( $pk: ID! ) {
    getPerson(pk: $pk) {
        name
        knows {
            name
            knows {
                name
                knows {
                    name
                    id
                }
                id
            }
            id
        }
        id
    }
}
```

## Run tests

```sh
npm run test
```

## Author

👤 **Sebastian Tilsch**

* Github: [@bastiion](https://github.com/bastiion)

## Show your support

Give a ⭐️ if this project helped you!

***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_