# check-eslint-config-compat

check-eslint-config-compat is a CLI tool to compare eslint config compatibility.

## Requirement

- `node > v18.18.0`
- `eslint > v8`

## Install

```
npm install -g @sajikix/check-eslint-config-compat@latest
```

or

```
npx @sajikix/check-eslint-config-compat@latest [command] [options]
```

## Usage

The use of this tool is divided into two steps.

1. export compatibility data based on the old config.
2. check the compatibility with the new config based on the data of step 1.

### 1: Export compatibility data based on the old config.

First, use the `extract` command to output the "compat" data.

```
@sajikix/check-eslint-config-compat extract -c .eslintrc.js -e js,jsx -t ./
```

Then compat dat (about the lint rule, target files and more...) will be output in JSON.(If not specified in option, the file name will be `.compat.json`)

### 2. check the compatibility with the new config based on the data of step 1.

The `compare` command report differences between the environment in which the extract command was executed and the current environment.

```
@sajikix/check-eslint-config-compat compare -c eslint.config.js -i .compat.json -t ./
```

It report the differences in rules and settings adapted to the files.

## option

### Common Options

#### -c, --config

**required**

Option for eslint config filepath.(Currently only the old eslintrc format is supported)

#### -t, --target

**default: ("./src")**

Option for eslint target directory.

### Options for `extract` command

#### -e, --ext

**default: ("js")**

Option for file extensions to be checked by eslint.

#### -o, --output

**default: ("./.compat.json")**

Option for Path of compat json file.

## option

### Options for `compare` command

#### -i, --import-path

**default: ("./.compat.json")**

Option for Path to compat json file.
