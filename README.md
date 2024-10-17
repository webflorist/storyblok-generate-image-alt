# Automated AI-generation of image alt-texts for the Storyblok CMS

[![npm version](https://img.shields.io/npm/v/storyblok-generate-image-alt.svg)](https://www.npmjs.com/package/storyblok-generate-image-alt)
[![license](https://img.shields.io/github/license/webflorist/storyblok-generate-image-alt)](https://github.com/webflorist/storyblok-generate-image-alt/blob/main/LICENSE)

An npx CLI tool to automatically generate alt-texts of images of a [Storyblok CMS](https://www.storyblok.com) space using the OpenAI API.

## Requirements

- A **Storyblok** space.
- A **OpenAI** account.

## Installation

```shell

# simply auto-download and run via npx
$ npx storyblok-generate-image-alt

# or install globally
$ npm install -g storyblok-generate-image-alt

# or install for project using npm
$ npm install storyblok-generate-image-alt

# or install for project using yarn
$ yarn add storyblok-generate-image-alt

# or install for project using pnpm
$ pnpm add storyblok-generate-image-alt
```

## Usage

Call `npx storyblok-generate-image-alt` with the following options:

### Options

```text
--token <token>                (required) Personal OAuth access token created
                               in the account settings of a Stoyblok user.
                               (NOT the Access Token of a Space!)
                               Alternatively, you can set the STORYBLOK_OAUTH_TOKEN environment variable.
--space <space_id>             (required) ID of the space to backup
                               Alternatively, you can set the STORYBLOK_SPACE_ID environment variable.
--openai-api-key <key>         (required) OpenAI API Key
                               Alternatively, you can set the OPENAI_API_KEY environment variable.
--region <region>              Region of the space. Possible values are:
                               - 'eu' (default): EU
                               - 'us': US
                               - 'ap': Australia
                               - 'ca': Canada
                               - 'cn': China
                               Alternatively, you can set the STORYBLOK_REGION environment variable.
--language <language>          (required) Language code to generate alt-text in.
--model <model>                OpenAI model to use. Defaults to 'gpt-4o-mini'.
--max-tokens <number>          Maximum tokens to use per API call. Defaults to '500'.
--max-characters <number>      Maximum characters for the generated text. Defaults to '125'.
--overwrite                    Overwrites existing alt-texts. Defaults to false.
--dry-run                      Only display the changes instead of performing them. Defaults to false.
--verbose                      Show detailed output for every processed asset.
--help                         Show this help
```

Storyblok OAuth token, space-id and region as well as the OpenAI API Key can be set via environment variables. You can also use a `.env` file in your project root for this (see `.env.example`).

### Minimal example

```shell
npx storyblok-generate-image-alt --token 1234567890abcdef --space 12345 --openai-api-key 1234567890abcdef --language en
```

### Maximal example

```shell
npx storyblok-generate-image-alt \
    --token 1234567890abcdef \
    --openai-api-key 1234567890abcdef \
    --region us \
    --language en \
    --model gpt-4o \
    --max-tokens 1000 \
    --max-characters 100 \
    --overwrite \
    --dry-run \
    --verbose
```

## License

This package is open-sourced software licensed under the [MIT license](https://github.com/webflorist/storyblok-generate-image-alt/blob/main/LICENSE).
