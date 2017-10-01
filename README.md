# TSLint Custom Linting Rules
Custom linting rules

# Current Rules
- Single Export per file
- Top level exports must contain JSDoc comment

# Single Export per file

Custom linting rule for one export per file, works between both TypeScript and JavaScript.

Large projects can have any number of modules and files and often have many developers working on them. This linting rule makes the workflow easier by enforcing that anything being exported should sit in its own file.

Discoverabiltiy is an important part of any project, and you should not need to look in 'interfaces.ts' and sift through 25 different exports just to find what you want.

If it's important enough for an export; it's important enough for a file.

Options:
- Enabled: Boolean

# Top level comments

Custom linting rule to ensure that all top level exports have comments stating the nature of the file

Once discovering a file, a developer should not have to read the majority of the code to understand what the class is used for, especially if it has an ambiguous name.

Options:
- Enabled: Boolean
- [
    Enabled: Boolean,
    MinimumCommentLength: Integer,
    BanEmptyTopLevelComments: Boolean
]