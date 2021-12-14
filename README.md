# Add Label to Cards

Adds a label to all cards in a column of a project.

## Parameters
### label_to_add
The text of the label to add
### column_id
The id of the column containing all the card issues to label
### column_name
The name of the column containing all the card issues to label  
Required with `project_name`  
If there are 2 projects with the same name the first one listed will be chosen  
### project_name
The name of the project containing the column  
Required with `column_name`  
If there are 2 projects with the same name the first one listed will be chosen  

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
          # Specify column using either
          column_id: '12345678' # Id of column with card issues to label
          # or
          column_name: 'To do' # Name of column with card issues to label
          project_name: 'Test' # Name of project containing column above
```
