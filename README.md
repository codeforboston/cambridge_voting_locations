Important note for fall 2016: Due to the time sensitive nature of this project, we are aiming to address all issues labeled with City of Cambridge Request first.

Cambridge Voting Locations
==========================

This app is intended to display the polling location within a user's ward/precinct, using their home address or current location. In addition, you can see a picture of the polling place, Google Maps directions, and a link to bring up directions in your browser or your mobile navigation application.

Data
----
Data has been culled from [Cambridge GIS](http://www.cambridgema.gov/GIS.aspx) open information sources, including [polling location data](https://github.com/codeforboston/cambridgegis_data/tree/master/Elections/Polling_Locations) and [ward/precinct boundary data](https://github.com/codeforboston/cambridgegis_data/tree/master/Elections/Wards_and__Precincts), all in GeoJSON format.

Development
-----------
The **cambridge_voting_locations** application is developed with [yeoman](http://yeoman.io/), based on top of [node.js](http://nodejs.org/).

Within the `cambridge_voting_locations` directory:
```sh
npm install        # installs local node and bower dependencies
npm start          # starts server
npm run build      # places a production copy of the app in the dist directory
```

All development work is done within the `app` directory. We're using [Yeoman's deployment strategy](http://yeoman.io/deployment.html). Before committing, please run `npm run build` and commit any changes within the `dist` directory as well.
