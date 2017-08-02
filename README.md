# makeshift

> Shove scopes and tokens into .npmrc

[![Build Status](https://travis-ci.org/nexdrew/makeshift.svg?branch=master)](https://travis-ci.org/nexdrew/makeshift)
[![Coverage Status](https://coveralls.io/repos/github/nexdrew/makeshift/badge.svg?branch=master)](https://coveralls.io/github/nexdrew/makeshift?branch=master)
[![Standard Version](https://img.shields.io/badge/release-standard%20version-brightgreen.svg)](https://github.com/conventional-changelog/standard-version)
[![Greenkeeper badge](https://badges.greenkeeper.io/nexdrew/makeshift.svg)](https://greenkeeper.io/)

Simple CLI and module to add scopes and auth tokens to npm userconfig. `makeshift` remembers the odd key-value syntax in `.npmrc` so you don't have to.

Useful for pre-install setup in CI builds or for manual npm config initialization when using a private registry.

## Examples

### CI

If using Travis, you could do this in your `.travis.yml` file:

```yaml
before_install:
- npm i -g makeshift && makeshift -s @myorg -r myregistry:8080
```

instead of this:

```yaml
before_install:
- printf "@myorg:registry=http://myregistry:8080/\n//myregistry:8080/:_authToken=${NPM_TOKEN}\n" >> ~/.npmrc
```

Note that `makeshift` will automatically pull an `NPM_TOKEN` env var and apply it to the given registry.

### Local

Let's say you use a private registry (like [npm Enterprise](https://www.npmjs.com/enterprise)) and you want to associate multiple scopes to your registry, `makeshift` has you covered:

```
makeshift -r https://npm.myco.com -s dev ops it
```

Or perhaps your auth provider uses 2-factor auth and you can't use `npm login` to fetch your token, just `makeshift` it:

```
makeshift -r https://npm.myco.com -t 17b18d9507644940cf46589210a2fa6f706776d3
```

Or do it all at once:

```
makeshift -r https://npm.myco.com -s dev ops it -t 17b18d9507644940cf46589210a2fa6f706776d3
```

## Install and Usage

### CLI

```
$ npm install -g makeshift
$ makeshift --help
Usage: makeshift [-s scope] [-r registry] [-t token]

Associate scopes and/or auth token to a registry in .npmrc

Options:
  -s, --scope     One or more scopes to associate                 [array:string]
  -r, --registry  The registry to apply scopes/token to                 [string]
  -t, --token     The token value to set for the registry               [string]
  -h, --help      Show help                           [commands: help] [boolean]
  -v, --version   Show version number              [commands: version] [boolean]
```

Note that the CLI will look for env vars prefixed with `NPM_` for any options not given on the command line, e.g. `NPM_TOKEN` (useful in CI environment).

### Module

```
npm install --save makeshift
```

```js
var makeshift = require('makeshift')
makeshift(opts)
  .then(npmCmds => npmCmds.forEach(c => console.log(c.cmd)))
  .catch(err => console.error('uh oh:', err))
```

## API

### `makeshift(opts)`

Accepts an options object and returns a then-able `Promise` that resolves to an array of "npm command" objects.

Options:

- `registry`: string, defaults to result of `npm config get registry`

    The registry URL to associate given scopes or auth token to.

- `scopes`: array of strings, no default

    One or more package scopes (namespaces) to associate to the registry.

- `token`: string, no default

    The auth token to apply to the registry.

- `run`: boolean, defaults to `false`

    Whether to run the generated npm commands (and modify `.npmrc`) when resolving the returned `Promise`.

Each "npm command" object given to the resolved `Promise` will include these properties:

- `cmd`: string

    The `npm config` command that would modify `.npmrc`

- `desc`: object

    An object describing the command, with the following properties:

    - `msg`: string

        An unformatted command description.

    - `args`: array of strings

        The arguments that could apply to `msg` during formatting.

## License

ISC © Contributors
