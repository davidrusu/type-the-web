# Setting Up Build Environment
Follow these [instructions](https://developer.mozilla.org/en-US/Add-ons/SDK/Tutorials/Installation) to install the ```addon-sdk```

You should now have a ```addon-sdk-1.x/``` directory. For the rest of these instructions we will assume you are inside of this directory.

## Getting the Code
Fork this repository on github and clone it to your computer

    git clone "clone/url/of/your/fork"

Your directory structure should now look something like this:

    addon-sdk-1.x
    ├── app-extension
    │   └── ...
    ├── bin
    │   └── ...
    ├── examples
    │   └── ...
    ├── lib
    │   └── ...
    ├── python-lib
    │   └── ...
    ├── test
    │   └── ...
    ├── LICENSE
    ├── mapping.json
    ├── package.json
    ├── README
    └── type-the-web
        ├── data
        │   └── ...
        ├── lib
        │   └── ...
        ├── package.json
        ├── README.md
        └── ttw-screen2.png

## Testing
If you haven't activated the addon-sdk environment already, run the command for your platform from the above instructions, I've duplicated them here for convenience.

#### OS X, FreeBSD, Linux
Bash:

    source bin/activate

Fish:

    source bin/activate.fish

Others:

    bash bin/activate

#### Windows

    bin/activate

### Testing the Add-on
To test the addon:

    cfx run

to build the addon for a release:

    cfx xpi

If you encountered any problems running the addon please open an issue on github

# Code Layout

## High Level Overview

    type-the-web
    ├── data                    # All interesting code and data is in here
    │   ├── constants               # Constants and maps between weird characters and typable ones
    │   │   ├── constants.js            # Constants ie. average word length ...
    │   │   ├── nonstandard-char-map.js # Typable versions of hard to type characters
    │   │   └── replace-map.js          # Characters that are replaced in the preprocessing phase 
    │   ├── greeting                # the panel that pops up whenever the addon button is pressed
    │   │   ├── greeting.css            # Popup panel style
    │   │   └── greeting.html           # Popup panel layout
    │   ├── images                  # logos/images
    │   │   ├── icon-16.png
    │   │   ├── icon-32.png
    │   │   ├── icon-64.png
    │   │   ├── ttw-logo-simple.svg
    │   │   └── ttw-logo.svg
    │   ├── libs                    # Libraries we use are stored here
    │   │   ├── jquery-2.1.1.min.js     # We use jquery for injecting the highlighting
    │   │   ├── ramda-0.8.0.min.js      # Ramda makes functional programming in JS nicer
    │   │   ├── smoothie.js             # Smoothie is used for the scrolling chart in the sidebar
    │   │   └── smoothie_patch.js       # Addon guidelines doesn't allow us to modify libs directly
    │   ├── stats                   # Code for displaying the stats is in here
    │   │   ├── stats.css               # Style the stats side bar
    │   │   ├── stats.html              # Side bar layout
    │   │   └── stats.js                # Updates the sidebar stats
    │   ├── style.css               # This styles the active page, ie. highlightin, selection box,..
    │   └── type-the-web.js         # Interesting stuff is here. Runs when a typing session starts
    ├── lib
    │   └── main.js                 # Entry point into the program, Called when addon is loaded
    ├── CONTRIBUTING.md         # <-- YOU ARE HERE
    ├── package.json            # Meta data about the plugin ie. version, name,...
    ├── README.md
    ├── ttw-screen2.png
    └── type-the-web.xpi        # The addon build that is distributed

# How Things Fit Together
When Firefox starts, it loads all of the enabled plugins, it does this by running ```./lib/main.js```. Here we setup a few things:

- Tell Firefox to inject ```data/style.css``` into every page
- Sidebar is initialized
- Initialize the button users click to activate the plugin
  - The greeting panel is reinitialized each time the plugin is pressed

## User Pushes the Add-on button
The ```onClick()``` handler for the button fires. To get a typing session going, we need to attach the relevant JavaScript files, to do this we use the ```tab.attach()``` method which takes a JS Object containing various properties we want to attach to a tab and *attaches* them to the tab.

We only care about attaching some script files so we only include the ```contentScriptFile```. The order in which we attach scripts is important eg. ```type-the-web.js``` uses functions from ```ramda-0.8.0.min.js```.

So the add-on is running and the user can select the block of text they want to start typing.

TODO: explain how ```type-the-web.js``` works
