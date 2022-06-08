# README #

Loadtest for frontend load via browser using Selenium and Python

### What is this repository for? ###

* Execute a browser based loadtest on KiesJeKraam using Selenium

### How do I get set up? ###

* env file

- refer to .env.example

* Install chromedriver

- Download from https://chromedriver.chromium.org/downloads
- Must be same version as your chrome browser!
- After download, unzip and put in /usr/local/bin folder
- Make sure the chromedriver is executable
- On Mac (to counter the security warning) you might need to run it once from the Finder with a right-click -> Open, then choose open again at the security prompt)

* Install python, make virtualenv and install packages in requirements.txt using pip

* Run loadtest: `./loadtest.sh`
