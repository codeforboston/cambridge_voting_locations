define(['jquery',
        'json!vendor/ELECTIONS_WardsPrecincts.geojson',
        'json!vendor/ELECTIONS_PollingLocations.geojson',
        'map_service'],
    function($, precinctsJSON, locationsJSON, mapService) {

    'use strict';
    
    var precincts = mapService.earlyPollsDataLayer.addGeoJson(precinctsJSON),
        pollingLocations = mapService.electionPollsDataLayer.addGeoJson(locationsJSON),
        precinctsPolygons = [];
        
    createPolygons();
    
    //function that populates the array with polygons representing each precinct, because data.polygon has little to no useful methods.
    function createPolygons(){
        
        var i = 0,
            len = precincts.length;
        
        for(i; i<len; i++){
         
            var currentFeature = precincts[i],
                currentPolygon = new google.maps.Polygon({
                                paths: currentFeature.getGeometry().getAt(0).getArray(),
                                clickable: false
                                });
                                                       
            precinctsPolygons.push(currentPolygon);

        }    
    }
    	
    function getUserPrecinct(latLng) {

        for (var i = 0, len1 = precinctsPolygons.length; i < len1; i++) {
            if (precinctsPolygons[i].containsLatLng(latLng)) {
                return  precinctsPolygons[i];
            }
        }
        
    }

    function getPollingLocation(precinct) {
        
        var index = precinctsPolygons.indexOf(precinct);
        // find out which ward/precinct they're in using Point in Polygon
        var wardPrecinct = precincts[index].getProperty('WardPrecinct');
        if (wardPrecinct === "3-2A") {
            wardPrecinct = "3-2";
        }
        //Search for the polling location that matches the precinct and ward
        for (var j = 0, len2 = pollingLocations.length; j < len2; j++) {
            if (pollingLocations[j].getProperty('W_P') === wardPrecinct) {
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
