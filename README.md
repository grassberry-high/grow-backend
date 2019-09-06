Grassberry High is an environmental controller for your home grow project. This repository contains the code for the backend Node.js server. Grassberry High is an open source software project. All contributions and the support is community based.

# Help
If you find any bugs, please use the issue tracker. 

In case you need personal assistance you can either use:
- our reddit channel (how to use)
- StackOverflow (coding)
- Git-Start (coding)

You are missing some feature? There are three ways to create new features:

- Contribute, read our [contribution guidelines](./contributing.md)
- Find someone to code it for you, (a [bounty](https://www.bountysource.com/) might help)
- Support development via the official [Patreon Campaign](https://www.patreon.com/grassberry)

We are looking for people to translate documents into other languages!

# Useful information 

# I2C Setup
detect on raspberry pi:
i2cdetect -y 1 (alias: checki2c)

0x20 (32) Relais Controller
0x21 (33), 0x22 (34) Chirp Water Sensor
0x40 (64), 0x43 (67) HDC1000
0x4d (77) MHZ16

# Development Slack

Drop an email to **hello \<\> grassberry-high.com** with the title `Invite me to Slack`
to get invited to the [Slack](https://grassberryhigh.slack.com/) channel.

# Run

## On the Pi3
Follow the instructions here:
[Build your own tutorial](http://blog.grassberry-high.com/build-your-own-grassberry-high/)

### Short Version

1. Plugin all sensors & controllers into the i2c bus and add the power supply
2. Connect to gh-config wifi hotspot
3. Enter http://grassberry.local
3. Enter your wifi credentials into the configuration, let the device reboot automatically
4. Done

# Configuration  Variables

## Basic

- NODE_ENV: sets the environment (devlopment, test, production)

## Api

- API_TOKEN: bearer token for api access, for future use

## Database

- MONGODB_URL: url to the database
- MONGODB_ADMIN: admin db

## Simulation

- SEED: automatically seed diff. collections e.g. "chambers sensors outputs rules cronjobs"
- USER_SEED_TOKEN: give a default token to every user for test reasons
- ON_SHOW_MODE_BLOCKED: block c/u of crud to prevent users to mess around with the system on a fair/exibition
- OS: turns on certain simulation functions e.g. I2C Bus, "MAC OSX"
- SIMULATION: turns on simulation mode for sensors

## Debug

- LONG_ERROR_TRACES: enables long error traces in prod mode (in dev always on)
- HEAP_SNAPSHOPT: turn heap snapshots on with 'true'
- DEBUG: enable debug loggers e.g. 'sensor*'

## Other

- NO_CRONS: Disables cronjobs

### Create a simulation set:

1. `mongoexport --db LOC_gh --collection sensordatas -f value --query '{detectorType: "temperature"}' | head -1000 > temperature-simulation.json`
2. `replace /{ "value" : (.*)\, .* }/ with $1,`
3. add brackets and ,


# Coding Guidlines

..1. Use separate branches for separate problems, feel free to push to master afterwards

..2. More code is read than written, be specific in variable names

..3. Small commits, commit the smallest unit

..4. Write unit tests on critical functions, write unit tests where they are missing

..5. No duplicate code, if code is needed twice, use classes, functions etc.

..6. Write comments, readme if something is not 100% self explaining

# Debugging
[Remote debugging tutorial](docs/debug.md)

# License
The project is licensed under MIT license.
By using/contributing to the project you accept the [license](https://github.com/360disrupt/grassberry-high/blob/master/LICENSE).
