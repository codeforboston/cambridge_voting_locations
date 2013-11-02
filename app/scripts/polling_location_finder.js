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


    function clearPreviousResults() {
        if (userPrecinct) {
            userPrecinct.setMap(null);
            userPrecinct = undefined;
        }
        directionsDisplay.setDirections({routes: []});

        $('.result').removeClass('success');
        $('#notice').empty();
    }

    return function(latLng) {
        clearPreviousResults();
        // find out which ward/precinct they're in using Point in Polygon
        var pollingLocation, wardPrecinct;
        for (var i = 0, len1 = precincts.length; i < len1; i++) {
            if (precincts[i].containsLatLng(latLng)) {
                userPrecinct = precincts[i];
                wardPrecinct = userPrecinct.geojsonProperties.WardPrecinct;
                if (wardPrecinct === "3-2A") {
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
            $('#notice')
                .addClass('error')
                .text = "We can't find your precinct! Sorry. Try again?";
        } else {
            $('.result').addClass('success');
            showResults();
            // highlight the precinct on the map
            userPrecinct.setMap(map);
            map.fitBounds(userPrecinct.getBounds());

            // show step-by-step directions
            var request = {
                origin: latLng,
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
