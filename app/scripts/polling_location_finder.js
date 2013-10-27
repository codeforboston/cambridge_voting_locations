define(['geojson', 'json!vendor/ELECTIONS_WardsPrecincts.geojson', 'json!vendor/ELECTIONS_PollingLocations.geojson'], function(GeoJSON, precinctsJSON, locationsJSON) {
    'use strict';

    var precincts = new GeoJSON(precinctsJSON),
        pollingLocations = new GeoJSON(locationsJSON);

    var map = new google.maps.Map(document.getElementById('map'), {
        center: new google.maps.LatLng(42.3736, -71.1106), // Cambridge!
        zoom: 12
    });
    var directionsService = new google.maps.DirectionsService(),
        directionsDisplay = new google.maps.DirectionsRenderer({
            map: map,
            preserveViewport: true,
            panel: document.getElementById('directions')
        });


    return function(coords) {
        // find out which ward they're in using Point in Polygon
        var userPrecinct = null, pollingLocation = null;
        for (var i = 0; i < precincts.length; i++) {
            if (precincts[i].containsLatLng(coords)) {
                userPrecinct = precincts[i];
                // polling locations are stored in the same order, so we can use the same index
                pollingLocation = pollingLocations[i];
                break;
            }
        }
        if (!userPrecinct) {
            // TODO handle what happens if they don't live in any precinct
        }

        // highlight the precinct on the map
        userPrecinct.setMap(map);
        map.fitBounds(userPrecinct.getBounds());

        // show step-by-step directions
        var request = {
            origin: coords,
            destination: pollingLocation.position,
            travelMode: google.maps.TravelMode.WALKING
        };
        directionsService.route(request, function(result, status) {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(result);
            }
        });
    };
});
