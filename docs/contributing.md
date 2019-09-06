# Introduction

### Welcome, nice to see you!

Thank you very much for contributing. People like you make Grassberry High to the best environmental controller on the market! 

### Please read the guidlines to save time and get you started

It's important, that contributions follow some rules in order to get a specific structure and quality in the project. So please read the following guid carefully. Following the guidelines is very important to get your contributions included into the project.

### How can you contribute

There are several ways you can help the project:

-  Write tutorials
-  Translate documents (e.g. Readme, contributing guidelines)
  - Please name the translated document: <original-name>.<language>.<extension> and link to it in the original document
- Triage/label issues
- Code
- Find someone to code it for you, (a [bounty](https://www.bountysource.com/) might help)
- Support development via the official [Patreon Campaign](https://www.patreon.com/grassberry)  

### Be kind

You found a bug or miss an important feature which makes you really angry. The project depends on work of the community. Please respect, that all contributors do their work voluntarily. Sometimes it takes time and sometimes nobody might be interested. 

# Ground Rules
### How to contribute code

1. Create an issue - please wait for an admins response
2. Pull the latest development branch
3. We use git-flow, make sure that you follow git-flows structure e.g. create feature branches
4. Create a feature or bugfix
  1. Make sure that you add enough tests to have a code coverage above 80%
  2. Make sure you don't break existing code
  3. Create/Update the documentation
  4. Use inline documentation (JS params)
  5. Make sure your code lints
5. Create a pull request to the development branch

Any of your contributions are licensed under MIT. Any commit must be [signed off](https://help.github.com/en/articles/signing-commits).

# Your First Contribution

If you have never contributed, reach out the admin or look for issues labeled as 'easy-first-issue'.
Here are a couple of friendly tutorials you can include: http://makeapullrequest.com/ and http://www.firsttimersonly.com/

If you need help with your first contribution, feel free to ask in the issue you opened for help!

# How to report a bug
### Security disclosures
If you find a security vulnerability, do NOT open an issue. Email hello@grassberry-high.com instead.

### File a bug report

1. What version of Node.js/GrassberryHigh are you using?
2. What operating system and processor architecture are you using?
3. What did you do?
4. What did you expect to see?
5. What did you see instead?

### Suggesting a feature

Please write explicit which functionality is missing. Include examples: input > output.

# Code review process
### How a contribution gets accepted after it’s been submitted.

The core team looks at Pull Requests on a regular basis in a weekly triage meeting. After feedback has been given we expect responses within two weeks. After two weeks we may close the pull request if it isn't showing any activity.

### Coding style

As mentioned above please make sure that your code lints. Please, format your code! 

### Explain if you use any commit message conventions.

We use the following style:

\<commit type\>: \<commit message\>
commit types are:
- min: minor change, e.g. removed a space
- update: new feature, e.g. update Water sensor hdc1000 has a safety fuse
- refactor: refactor, e.g. use forEach instead of Array.from
- fix: bug fixes, e.g. relay controller does not fail after switching relay
- other: (anything else)


# Git
check this guide: `http://rogerdudler.github.io/git-guide/

### Getting the project
`git pull <url>`
fork the project to contribute.

### How to contribute with git

#### add files
`git add --p` (adds single changes)
`git add <filename>` (adds files)

#### do a commit
`git commit -m "<your message>"`

#### upload
`git pull --rebase origin develop` (get the newest version)
(maybe you need to solve merge conflicts)
`git push origin <branch>`

add new packages for production with
`npm add --save <module>`

for development with
`npm add --save-dev <module>`
