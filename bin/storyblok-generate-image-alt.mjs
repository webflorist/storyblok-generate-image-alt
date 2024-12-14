#!/usr/bin/env node
/* eslint-disable no-console */
import minimist from 'minimist'
import StoryblokClient from 'storyblok-js-client'
import { performance } from 'perf_hooks'
import dotenvx from '@dotenvx/dotenvx'
import OpenAI from 'openai'

const startTime = performance.now()

dotenvx.config({ quiet: true })

const args = minimist(process.argv.slice(2))

if ('help' in args) {
	console.log(`USAGE
  $ npx storyblok-generate-image-alt
  
OPTIONS
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

MINIMAL EXAMPLE
  $ npx storyblok-generate-image-alt --token 1234567890abcdef --space 12345 --openai-api-key 1234567890abcdef --language en

MAXIMAL EXAMPLE
  $ npx storyblok-generate-image-alt \\
      --token 1234567890abcdef \\
      --openai-api-key 1234567890abcdef \\
      --region us \\
      --language en \\
      --model gpt-4o \\
      --max-tokens 1000 \\
      --max-characters 100 \\
      --overwrite \\
      --dry-run \\
      --verbose
`)
	process.exit(0)
}

if (!('token' in args) && !process.env.STORYBLOK_OAUTH_TOKEN) {
	console.log(
		'Error: State your oauth token via the --token argument or the environment variable STORYBLOK_OAUTH_TOKEN. Use --help to find out more.'
	)
	process.exit(1)
}
const oauthToken = args.token || process.env.STORYBLOK_OAUTH_TOKEN

if (!('space' in args) && !process.env.STORYBLOK_SPACE_ID) {
	console.log(
		'Error: State your space id via the --space argument or the environment variable STORYBLOK_SPACE_ID. Use --help to find out more.'
	)
	process.exit(1)
}
const spaceId = args.space || process.env.STORYBLOK_SPACE_ID

let region = 'eu'
if ('region' in args || process.env.STORYBLOK_REGION) {
	region = args.region || process.env.STORYBLOK_REGION

	if (!['eu', 'us', 'ap', 'ca', 'cn'].includes(region)) {
		console.log('Error: Invalid region parameter stated. Use --help to find out more.')
		process.exit(1)
	}
}

const verbose = 'verbose' in args

if (!('openai-api-key' in args) && !process.env.OPENAI_API_KEY) {
	console.log(
		'Error: State your OpenAI API key via the --openai-api-key argument or the environment variable OPENAI_API_KEY. Use --help to find out more.'
	)
	process.exit(1)
}
const openaiApiKey = args['openai-api-key'] || process.env.OPENAI_API_KEY

if (!('language' in args)) {
	console.log(
		'Error: State the desired language using the --language argument. Use --help to find out more.'
	)
	process.exit(1)
}
const language = args['language']

const model = args['model'] || 'gpt-4o-mini'

const maxCharacters = args['max-characters'] || '125'

const maxTokens = args['max-tokens'] ? Number.parseInt(args['max-tokens']) : 500

// Init Management API
const StoryblokMAPI = new StoryblokClient({
	oauthToken: oauthToken,
	region: region,
})

// Init OpenAI API
const openai = new OpenAI({
	apiKey: openaiApiKey,
})

// Setup cache
const cache = {}

// Default generation function
let totalUsedTokens = 0
const generateAltText = async (url) => {
	if (url in cache) {
		return cache[url]
	}

	const response = await openai.chat.completions.create({
		model: model,
		messages: [
			{
				role: 'system',
				content: [
					{
						type: 'text',
						text: `You are an image analyst. Your goal is to generate an alt-text for this image and output the result in the following language: ${language}. Limit the output to ${maxCharacters} characters.`,
					},
				],
			},
			{
				role: 'user',
				content: [
					{
						type: 'text',
						text: 'Follow the instructions and rules provided in the System role.',
					},
					{
						type: 'image_url',
						image_url: {
							url: url,
						},
					},
				],
			},
		],
		max_completion_tokens: maxTokens,
	})

	cache[url] = response.choices[0].message.content

	totalUsedTokens += response.usage.total_tokens

	return response.choices[0].message.content
}

// Write console.log, if verbose mode is enabled
const verboseLog = (...args) => {
	if (verbose) {
		console.log(...args)
	}
}

// General information
console.log('')
console.log(`Performing generation of alt-texts for space ${spaceId}:`)
console.log(`- language: ${language}`)
console.log(`- max characters: ${maxCharacters}`)
console.log(`- max tokens: ${maxTokens}`)
console.log(`- mode: ${args['dry-run'] ? 'dry-run' : 'live'}`)
console.log(`- overwrite: ${args.overwrite ? 'yes' : 'no'}`)

// Fetch all assets
console.log('')
console.log(`Fetching assets...`)
const assets = await StoryblokMAPI.getAll(`spaces/${spaceId}/assets`)

// Process assets
console.log('')
console.log(`Processing assets...`)
for (const asset of assets) {
	verboseLog('')
	verboseLog(`- Asset "${asset.filename}" (ID "${asset.id}"):`)

	if (!asset.content_type.includes('image/')) {
		verboseLog('  Not an image. Skipping.')
		continue
	}

	if (asset.meta_data.alt.length > 0 && !args.overwrite) {
		verboseLog(
			`  Alt-text already exists ("${asset.alt}") and --overwrite parameter is not set. Skipping.`
		)
		continue
	}

	const altText = await generateAltText(asset.filename)

	verboseLog(`  Generated alt-text: ${altText}`)

	if (args['dry-run']) {
		verboseLog('  Dry-run mode. No changes performed.')
		continue
	}

	asset.alt = altText
	asset.meta_data.alt = altText

	await StoryblokMAPI.put(`spaces/${spaceId}/assets/${asset.id}`, asset)

	verboseLog('  Asset successfully updated.')
}

const endTime = performance.now()

console.log('')
console.log(`Process successfully finished in ${Math.round((endTime - startTime) / 1000)} seconds.`)
console.log(`Total used OpenAI tokens: ${totalUsedTokens}`)
process.exit(0)
