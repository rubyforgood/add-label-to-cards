const core = require('@actions/core');
const github = require('@actions/github');
const token = core.getInput('token');
const labelToAdd = core.getInput('label_to_add');
const columnId = core.getInput('column_id');
const repoOwner = github.context.repo.owner;
const repo = github.context.repo.repo;
const octokit = github.getOctokit(token);

async function main() {
  // Get the cards from the given column
  var cards = null;
  try {
    cards = await octokit.projects.listCards({
      column_id: columnId,
      archived_state: 'not_archived',
      per_page: 100
    });
  }
  catch (e) {
    console.log(e.message);
    return;
  }

  // Add the label to the cards
  cards.data.forEach(async card => {
    if (!card.content_url) {
      return true;
    }
    const matches = card.content_url.match(/\/issues\/(\d+)/);
    if (!matches) {
      console.log(`Couldn't match the regexp against '${card.content_url}'.`);
      return true;
    }
    
    const issueNumber = matches[1];
    try {
      await octokit.issues.addLabels({
        owner: repoOwner,
        repo: repo,
        issue_number: issueNumber,
        labels: [labelToAdd]
      });
    }
    catch (e) {
      console.log(e.message);
      return true;
    }
  });
}

try {
  main();
} catch (e) {
  console.error(e.message);
}
