# Add Label to Cards

Adds a label to all cards in a column of a project.

## Parameters
### columns_labels:  
A JSON Array of objects containing keys
 - `"labels"` An array of all the labels as strings  
 Either  
 - `"column_id"` The id of a column as an integer  
 or
 - `"column_name"` The name of the column
 - `"project_name"` The name of the project containing the column

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
        uses: rubyforgood/add-label-to-cards@v3.3
        id: add-help-wanted-labels
        with:
          token: ${{secrets.GITHUB_TOKEN}}
          columns_labels: >
            [
              {
                "column_name": "To do",
                "labels": ["Help Wanted"],
                "project_name": "Test"
              },
              {
                "column_name": "Second Column",
                "labels": ["Help Wanted"],
                "project_name": "Test"
              },
              {
                "column_id": 16739169,
                "labels": ["Help Wanted"]
              },
            ]
```
