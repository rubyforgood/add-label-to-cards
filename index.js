const core = require('@actions/core')
const github = require('@actions/github')
const token = core.getInput('token')
const labelToAdd = core.getInput('label_to_add')
const columnId = core.getInput('column_idd')
const repoOwner = github.context.repo.owner
const repo = github.context.repo.repo
const octokit = github.getOctokit(token)

// Determines if an object is an object
//  @param    {any} variable The variable to check
//  @returns  {boolean} true if variable is an object, false otherwise
function isObject (variable) {
  return typeof variable === 'object' && !Array.isArray(variable) && variable !== null
}

// Lists cards for a column
//  @param    {integer} columnId The id of the column containing the cards
//  @returns  {Promise} A promise representing fetching the list of cards
//  @throws   {TypeError}  for a parameter of the incorrect type
//  @throws   {RangeError} if columnId is negative
//  @throws   {Error} if an error occurs while trying to fetch the card data
async function getCards (columnId) {
  if (typeof columnId === 'string') {
    columnId = parseInt(columnId)

    if (!columnId) { // The column id isn't going to be 0
      throw new TypeError('Param columnId is not an integer')
    }
  }

  if (!Number.isInteger(columnId)) {
    throw new TypeError('Param columnId is not an integer')
  } else if (columnId < 0) {
    throw new RangeError('Param columnId cannot be negative')
  }

  return await octokit.projects.listCards({
    column_id: columnId,
    archived_state: 'not_archived',
    per_page: 100
  })
}

// Adds a label to a card if it is an issue
//  @param    {object} card An object representing the card to be labeled
//  @returns  {Promise} A promise representing the labeling of the card
//  @throws   {TypeError}  for a parameter of the incorrect type
//  @throws   {Error} if an error occurs while labeling the card
async function labelCardIssue (card) {
  if (!isObject(card)) {
    throw new TypeError('Param card is not an object')
  }

  if (!card.content_url) {
    console.log(`INFO: card with id: ${ card.id } is not an issue`)
    return
  }

  const issueNumberMatchCapture = card.content_url.match(/\/issues\/(\d+)$/)

  if (!issueNumberMatchCapture || issueNumberMatchCapture.length < 2) {
    throw new Error(`Failed to extract issue number from url: ${card.content_url}`)
  }

  const issueNumber = issueNumberMatchCapture[1]

  return octokit.issues.addLabels({
    owner: repoOwner,
    repo: repo,
    issue_number: issueNumber,
    labels: [labelToAdd]
  })
}

async function main () {
  let cards

  try {
    cards = await getCards(columnId)
    console.log(JSON.stringify(cards))
  } catch (e) {
    console.error("ERROR: Failed to fetch card data")
    console.error(e.message)
    process.exit(1)
  }

  // Add the label to the cards
  cards.data.forEach(async (card) => {
    try {
      await labelCardIssue(card)
    } catch (e) {
      console.warn(`WARNING: Failed to label card with id: ${card.id}`)
      console.warn(e.message)
    }
  })
}

try {
  main()
} catch (e) {
  console.error(e.message)
}
