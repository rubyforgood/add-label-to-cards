# Add Label to Cards

Adds a label to all cards in a column of a project.

## Parameters
### label_to_add
The text of the label to add
### column_id
The id of the column containing all the cards to label

## Example Usage
```
on:
  schedule:
    - cron:  '0 * * * *' # Run every hour

jobs:
  add_help_wanted_labels:
    runs-on: ubuntu-latest
    name: Add help wanted labels
    steps:
      - name: Add help wanted labels
        uses: rubyforgood/add-label-to-cards@v1
        id: add-help-wanted-labels
        with:
          token: ${{secrets.GITHUB_TOKEN}}
          label_to_add: 'LABEL TEXT'
          column_id: '12345678' # Id of column to add labels
```
