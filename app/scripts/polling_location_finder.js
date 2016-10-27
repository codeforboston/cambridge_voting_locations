define(['jquery',
        'map_service'],
    function($, mapService) {

    'use strict';
	
    function getUserPrecinct(latLng) {

        for (var i = 0, len1 = mapService.precinctsPolygons.length; i < len1; i++) {
			var currentPrecinct = mapService.precinctsPolygons[i];
			
            if (currentPrecinct.containsLatLng(latLng)) {
                return  currentPrecinct;
            }
			
        }
        
    }

    function getPollingLocation(precinct) {
        
        var index = mapService.precinctsPolygons.indexOf(precinct);
        // find out which ward/precinct they're in using Point in Polygon
        var wardPrecinct = mapService.precincts[index].getProperty('WardPrecinct');
        if (wardPrecinct === "3-2A") {
            wardPrecinct = "3-2";
        }
        //Search for the polling location that matches the precinct and ward
        for (var j = 0, len2 = mapService.pollingLocations.length; j < len2; j++) {
            if (mapService.pollingLocations[j].getProperty('W_P') === wardPrecinct) {
                return mapService.pollingLocations[j];
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

            var destination = pollingLocation.getProperty('Address') + ', Cambridge, MA';
            mapService.displayNewPollingPlace(latLng, destination, userPrecinct, successCallback, errorCallback);
            // userPrecinct.setMap(map);
            // map.fitBounds(userPrecinct.getBounds());

            // display location notes
            $('#info .location').text(pollingLocation.getProperty('LOCATION'));
            $('#info .notes').text(pollingLocation.getProperty('LOCATION_NOTE'));

        }
    };
});
