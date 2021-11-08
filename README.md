# Add Label to Cards

Adds the given label to all cards in the given column.

## Example Usage
```
on:
  schedule:
    # * is a special character in YAML so you have to quote this string
    - cron:  '0 * * * *'

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
          label_to_add: 'Help Wanted'
          column_id: '16739169'
```
