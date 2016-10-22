define(['jquery', 'geojson',
        'json!vendor/ELECTIONS_WardsPrecincts.geojson',
        'json!vendor/ELECTIONS_PollingLocations.geojson',
        'map_service'],
    function($, GeoJSON, precinctsJSON, locationsJSON, mapService) {

    'use strict';

    var precincts = new GeoJSON(precinctsJSON),
        pollingLocations = new GeoJSON(locationsJSON);


    function getUserPrecinct(latLng) {
        for (var i = 0, len1 = precincts.length; i < len1; i++) {
            if (precincts[i].containsLatLng(latLng)) {
                return precincts[i];
            }
        }
    }

    function getPollingLocation(precinct) {
        // find out which ward/precinct they're in using Point in Polygon
        var wardPrecinct = precinct.geojsonProperties.WardPrecinct;
        if (wardPrecinct === "3-2A") {
            wardPrecinct = "3-2";
        }
        //Search for the polling location that matches the precinct and ward
        for (var j = 0, len2 = pollingLocations.length; j < len2; j++) {
            if (pollingLocations[j].geojsonProperties.W_P === wardPrecinct) {
                return pollingLocations[j];
            }
        }
    }

    function getDirections(destination) {
        var url;
        if (navigator.userAgent.match(/iPhone|iPad|iPod/)) {
            url = "http://maps.apple.com/?saddr=Current+Location&daddr=";
        } else {
            url = "https://maps.google.com/maps?daddr=";
        }
        return encodeURI(url + destination);
    }


    return function(latLng, successCallback, errorCallback) {


        var userPrecinct = getUserPrecinct(latLng);


        if (!userPrecinct) {
            $('#notice')
                .addClass('error')
                .text("We can't find your precinct! Sorry. Try again?");
        } else {
            var pollingLocation = getPollingLocation(userPrecinct);
            $('.result').addClass('success');

            var destination = pollingLocation.geojsonProperties.Address + ', Cambridge, MA';
            mapService.displayNewPollingPlace(latLng, destination, userPrecinct, successCallback, errorCallback);
            // userPrecinct.setMap(map);
            // map.fitBounds(userPrecinct.getBounds());

            // display location notes
            $('#info .location').text(pollingLocation.geojsonProperties.LOCATION);
            $('#info .notes').text(pollingLocation.geojsonProperties.LOCATION_NOTE);

        }
    };
});
