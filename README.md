# Add Label to Cards

Adds the given label to all cards in the given column.

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
