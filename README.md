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
