const core = require('@actions/core')
const github = require('@actions/github')
const token = core.getInput('token')
const labelToAdd = core.getInput('label_to_add')
const columnId = core.getInput('column_id')
const repoOwner = github.context.repo.owner
const repo = github.context.repo.repo
const octokit = github.getOctokit(token)

// Lists cards for a column
//  @param    {integer} columnId The id of the column containing the cards
//  @returns  {Promise} A promise representing fetching the list of cards
//  @throws   {TypeError}  for a parameter of the incorrect type
//  @throws   {RangeError} if columnId is negative
//  @throws   {Error} if an error occurs while trying to fetch the card data
async function getCards (columnId) {
  if (typeof columnId === 'string') {
    columnId = parseInt(columnId)

    if (!columnId) { // realistically the column id isn't going to be 0
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

async function main () {
  let cards

  try {
    cards = await getCards(columnId)
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }

  // Add the label to the cards
  cards.data.forEach(async card => {
    if (!card.content_url) {
      return true
    }
    const matches = card.content_url.match(/\/issues\/(\d+)/)
    if (!matches) {
      console.log(`Couldn't match the regexp against '${card.content_url}'.`)
      return true
    }

    const issueNumber = matches[1]
    try {
      await octokit.issues.addLabels({
        owner: repoOwner,
        repo: repo,
        issue_number: issueNumber,
        labels: [labelToAdd]
      })
    } catch (e) {
      console.error(e.message)
      return true
    }
  })
}

try {
  main()
} catch (e) {
  console.error(e.message)
}
