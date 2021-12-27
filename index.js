const core = require('@actions/core')
const github = require('@actions/github')
let columns_labels = core.getInput('columns_labels')
const token = core.getInput('token')
let columnId = core.getInput('column_id')
const columnName = core.getInput('column_name')
const labelToAdd = core.getInput('label_to_add')
const projectName = core.getInput('project_name')
// Javascript destructuring assignment. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
const {owner, repo} = github.context.repo
const octokit = github.getOctokit(token)

const MAX_CARDS_PER_PAGE = 100 // from https://docs.github.com/en/rest/reference/projects#list-project-cards

// Determines if an object is an object
//  @param    {any} variable The variable to check
//  @returns  {boolean} true if variable is an object, false otherwise
function isObject (variable) {
  return typeof variable === 'object' && !Array.isArray(variable) && variable !== null
}

// Lists up to MAX_CARDS_PER_PAGE cards from a column
//  @param    {integer} columnId The id of the column containing the cards
//  @param    {integer} pageNumber The page of up to MAX_CARDS_PER_PAGE cards to retrieve
//              default 1
//  @return   {Promise} A promise representing fetching the page of cards
//    @fulfilled {Array} The card data as an array of objects
//  @throws   {TypeError}  for a parameter of the incorrect type
//  @throws   {RangeError} if columnId is negative
//  @throws   {RangeError} if pageNumber is less than 1
//  @throws   {Error} if an error occurs while trying to fetch the card data
async function getCardPage (columnId, pageNumber = 1) {
  if (typeof columnId === 'string') {
    columnId = parseInt(columnId)

    if (!columnId) { // The column id isn't going to be 0
      throw new TypeError('Param columnId is not an integer')
    }
  }

  if (typeof pageNumber === 'string') {
    pageNumber = parseInt(pageNumber)

    if (!pageNumber) { // The column id isn't going to be 0
      throw new TypeError('Param pageNumber is not an integer')
    }
  }

  if (!Number.isInteger(columnId)) {
    throw new TypeError('Param columnId is not an integer')
  } else if (columnId < 0) {
    throw new RangeError('Param columnId cannot be negative')
  }

  if (!Number.isInteger(pageNumber)) {
    throw new TypeError('Param pageNumber is not an integer')
  } else if (pageNumber < 1) {
    throw new RangeError('Param pageNumber cannot be less than 1')
  }

  return await octokit.projects.listCards({
    column_id: columnId,
    archived_state: 'not_archived',
    page: pageNumber,
    per_page: MAX_CARDS_PER_PAGE
  })
}

// Get the column with name passed to columnName
//  @param    {integer} projectId The id of the project containing the column
//  @return   {Promise} A promise representing fetching of the column
//    @fulfilled {Object} An object representing the first column with name matching columnName
//                        undefined if the column could not be found
//  @throws   {TypeError}  for a parameter of the incorrect type
//  @throws   {RangeError}  if projectId is less than 1
//  @throws   {Error} if an error occurs while trying to fetch the project data
async function getColumn (projectId) {
  if (typeof projectId === 'string') {
    columnId = parseInt(projectId)

    if (!projectId) { // The project id isn't going to be 0
      throw new TypeError('Param projectId is not an integer')
    }
  }

  if (!Number.isInteger(projectId)) {
    throw new TypeError('Param projectId is not an integer')
  } else if (projectId < 0) {
    throw new RangeError('Param projectId cannot be negative')
  }

  const columnList = await octokit.request('GET /projects/{project_id}/columns', {
    project_id: projectId
  })

  return columnList.data.find((column) => {
    return column.name === columnName
  })
}

// Lists all the cards for a column that are issues
//  @param    {integer} columnId The id of the column containing the cards
//  @return   {Promise} A promise representing fetching of card data
//    @fulfilled {Array} The card data as an array of objects
//  @throws   {TypeError}  for a parameter of the incorrect type
//  @throws   {RangeError} if columnId is negative
//  @throws   {Error} if an error occurs while trying to fetch the card data
async function getColumnCardIssues (columnId) {
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

  let cardIssues = []
  let cardPage
  let page = 1

  do {
    cardPage = await getCardPage(columnId, page)

    // filter out non issue cards
    let pageCardIssues = cardPage.data.filter((card) => {
      return card.content_url
    })
    
    cardIssues.push(...pageCardIssues)
    page++
  } while (cardPage.data.length === MAX_CARDS_PER_PAGE)

  return cardIssues
}

// Get the project with name passed into projectName from the current repo
//  @return   {Promise} A promise representing fetching of the project
//    @fulfilled {Object} An object representing the first project with name matching projectName
//                        undefined if the project could not be found
//  @throws   {Error} if an error occurs while trying to fetch the project data
async function getProject () {
  const repoProjects = await octokit.request('GET /repos/{owner}/{repo}/projects', {
    owner: owner,
    repo: repo
  })

  return repoProjects.data.find((project) => {
    return project.name === projectName
  })
}

// Adds a label to a card if it is an issue
//  @param    {object} card An object representing the card to be labeled
//  @return   {Promise} A promise representing the labeling of the card
//  @throws   {TypeError}  for a parameter of the incorrect type
//  @throws   {Error} if an error occurs while labeling the card
async function labelCardIssue (card) {
  if (!isObject(card)) {
    throw new TypeError('Param card is not an object')
  }

  if (!card.content_url) {
    throw new ReferenceError(`Card with id: ${ card.id } is missing field "content_url"`)
  }

  const issueNumberMatchCapture = card.content_url.match(/\/issues\/(\d+)$/)

  if (!issueNumberMatchCapture || issueNumberMatchCapture.length < 2) {
    throw new Error(`Failed to extract issue number from url: ${card.content_url}`)
  }

  const issueNumber = issueNumberMatchCapture[1]

  return octokit.issues.addLabels({
    owner: owner,
    repo: repo,
    issue_number: issueNumber,
    labels: [labelToAdd]
  })
}

// Adds a github labeld to each card of a list
//  @param    {Array} cardData The list of cards to be labeled
//  @return   {Promise} A promise representing labeling the list of cards
//    @fulfilled {integer} The number of cards successfully labeled
//  @throws   {TypeError}  for a parameter of the incorrect type
//  @throws   {RangeError} if columnId is negative
//  @throws   {Error} if an error occurs while trying to fetch the card data
function labelCards(cardData) {
  const delayBetweenRequestsMS = cardData.length >= MAX_CARDS_PER_PAGE ? 1000 : 0

  if (delayBetweenRequestsMS) {
    console.log('INFO: A large number of label issue requests will be sent. Throttling requests.')
  }

  return new Promise((resolve, reject) => {
    let cardLabelAttemptCount = 0
    let cardsLabeledCount = 0
    let requestSentCount = 0

    const requestInterval = setInterval(() => {
      const card = cardData[requestSentCount]

      labelCardIssue(card).then(() => {
        cardsLabeledCount++
      }).catch((e) => {
        console.warn(`WARNING: Failed to label card with id: ${card.id}`)
        console.warn(e.message)
      }).finally(() => {
        cardLabelAttemptCount++

        if (cardLabelAttemptCount === cardData.length) {
          resolve(cardsLabeledCount)
        }
      })

      if (++requestSentCount === cardData.length) {
        clearInterval(requestInterval);
      }
    }, delayBetweenRequestsMS);
  })
}

// Validates the columns_labels user arg
//  @param    {string} columns_labels_as_string The value of columns_labels passed by the bot user
//  @return   {array} An array of the valid objects containing column and label data
//  @throws   {Error}  When the arguments are fatally invalid
function validateColumnsLabels (columns_labels_as_string) {
  let columns_labels_as_JSON

  try {
    columns_labels_as_JSON = JSON.parse(columns_labels_as_string)
  } catch (e) {
    console.error('ERROR: Could not parse param columns_labels as JSON')
    throw e
  }

  if (!Array.isArray(columns_labels_as_JSON)) {
    throw new TypeError('ERROR: param columns_labels must be an array')
  }

  columns_labels_as_JSON = columns_labels_as_JSON.filter((column_labels, index) => {
    if (!isObject(column_labels)) {
      console.warn(`WARNING: element at index=${index} of columns_labels is not an object`)
      console.warn(`  Skipping element at index=${index}`)
      return false
    }

    const labels = !('labels' in column_labels && // Object does not have key "labels"
      Array.isArray(column_labels.labels) && // value from key "labels" is not an array
      column_labels.labels.length) // "labels" array is empty
      ? [] : column_labels.labels.filter((label) => { return typeof label === 'string' && label.length })

    console.log(labels)

    if (!labels.length) {
      console.warn(`WARNING: element at index=${index} of columns_labels does not contain valid labels`)
      console.warn(`  Skipping element at index=${index}`)
      return false
    }
  })
}

async function main () {
  /*if (!labelToAdd.length) {
    throw new ReferenceError(`Missing required arg label_to_add`)
  }

  if (!columnId.length && projectName.length && columnName.length) {
    let project
    try {
      project = await getProject()
    } catch (e) {
      console.error(`ERROR: Failed to find project with name ${projectName}`)
      console.error(e.message)
      process.exit(1)
    }

    try {
      columnId = (await getColumn(project.id)).id
    } catch (e) {
      console.error(`ERROR: Failed to find column with name ${columnName}`)
      console.error(e.message)
      process.exit(1)
    }
  } else if (!columnId.length) {
    throw new ReferenceError(`Missing args required to identify column containing card issues to label`)
  }

  let cards

  try {
    cards = await getColumnCardIssues(columnId)
  } catch (e) {
    console.error("ERROR: Failed to fetch card data")
    console.error(e.message)
    process.exit(1)
  }

  const cardsLabeledCount = await labelCards(cards)

  console.log(`Labeled/relabeled ${cardsLabeledCount} of ${cards.length} card issues`)*/
  console.log(validateColumnsLabels(columns_labels))
  return
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
