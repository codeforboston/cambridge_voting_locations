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

    // keep track of user precinct across calls so we can erase previous precincts if necessary
    var userPrecinct;

    return function(coords) {
        // if we've already drawn a user precinct, erase it
        if (userPrecinct) {
            userPrecinct.setMap(null);
            userPrecinct;
        }
        // find out which ward they're in using Point in Polygon
        var pollingLocation, wardPrecinct;
        for (var i = 0, len1 = precincts.length; i < len1; i++) {
            if (precincts[i].containsLatLng(coords)) {
                userPrecinct = precincts[i];
                wardPrecinct = userPrecinct.geojsonProperties.WardPrecinct;
                if(wardPrecinct==="3-2A"){
                    wardPrecinct = "3-2";
                }
                //Search for the polling location that matches the precinct and ward
                for (var j = 0, len2 = pollingLocations.length; j < len2; j++) {
                    if (pollingLocations[j].geojsonProperties.W_P === wardPrecinct) {
                        pollingLocation = pollingLocations[j];
                        break;
                    }
                }
                break;
            }
        }
        if (!userPrecinct) {
            // TODO handle what happens if they don't live in any precinct
            document.getElementById('directions').innerHTML = "We can't find your precinct! Sorry. Try again?";
        } else {
            // highlight the precinct on the map
            userPrecinct.setMap(map);
            map.fitBounds(userPrecinct.getBounds());

            // show step-by-step directions
            var request = {
                origin: coords,
                destination: pollingLocation.geojsonProperties.Address + ', Cambridge, MA',
                travelMode: google.maps.TravelMode.WALKING
            };
            directionsService.route(request, function(result, status) {
                if (status === google.maps.DirectionsStatus.OK) {
                    directionsDisplay.setDirections(result);
                }
            });
        }
    };
});
