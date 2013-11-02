cambridge_voting_locations
==========================

This app is intended to display polling locations within a user's ward, using their home address.

Features:
- Points: polling locations
- Find the nearest polling location (according to their current location and according to their home address)
- Directions to the nearest polling location (default: from home address)
- Picture of polling location (including data, such as address, hours, etc.)
- Link to City of Cambridge website to learn more about current elections

Data:
- Polling locations (geojson points)
https://github.com/codeforboston/cambridgegis_data/tree/master/Elections/Polling_Locations
- Ward Boundaries (geojson polygons)
https://github.com/codeforboston/cambridgegis_data/tree/master/Elections/Wards_and__Precincts

Specs:
- GoogleMapsAPI
- Backbone.js (_underscore?)
- Build the application in such a way that other cities can use it as a template and simply plug in their own data.

Layout:
- Model: wrapper around geojson data
- Collection: polling places per ward (Haversine formula for directions/GoogleMaps directions)
- View: listens to events (clicking, searching, ...?) and renders template


## Getting Set Up for Development.

#### You'll need a few things:

+ [Ruby](https://www.ruby-lang.org/en/downloads/)
+ [Compass](http://compass-style.org/install/)
+ [NPM](https://gist.github.com/isaacs/579814)
+ [Bower](http://bower.io/)
+ [Grunt](http://gruntjs.com/installing-grunt)

##### The short version on Mac OS X:

```sh
\curl -L https://get.rvm.io | bash -s stable --ruby  # Install Ruby  
gem install compass                                  # Install Compass  
ruby -e "$(curl -fsSL https://raw.github.com/mxcl/homebrew/go)" # Install Homebrew (to install Node)  
brew install node                                    # Install Node  
curl https://npmjs.org/install.sh | sh               # Install NPM  
npm install -g bower                                 # Install Bower  
npm install -g grunt-cli                             # Install Grunt CLI  

```

#### Install everything.

1. Clone the repository.

`git clone git@github.com:codeforboston/cambridge_voting_locations.git`
`cd cambridge_voting_locations`

2. Install dependencies.

Within the directory: `npm install`.

3. Install the app's bower packages.

`bower install`

4. Do the Grunt work.

`grunt`

(If `which grunt` returns empty, try `/usr/local/share/npm/grunt` on Mac OS X, and add that to your $PATH.)

4. Install dependencies.

