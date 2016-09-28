define(['jquery', 'geojson', 'json!vendor/ELECTIONS_WardsPrecincts.geojson', 'json!vendor/ELECTIONS_PollingLocations.geojson'], function($, GeoJSON, precinctsJSON, locationsJSON) {
    'use strict';

    var precincts = new GeoJSON(precinctsJSON),
        pollingLocations = new GeoJSON(locationsJSON);
    
    window.predict = precincts;
    console.log("This is the precints" );
    console.log(precincts);
    console.log("These are the polling locations");
    console.log(pollingLocations);

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

    // TODO move UI interaction into its own module

    function showResults() {
        $('.modal').modal('hide');
    }

    function hideResults(e) {
        e.preventDefault();
        $('.modal').modal('show');
    }

    $('.back').on('click', hideResults);

    // keep track of user precinct across calls so we can erase previous precincts if necessary
    var userPrecinct;


    function clearPreviousResults() {
        if (userPrecinct) {
            userPrecinct.setMap(null);
            userPrecinct = undefined;
        }
        directionsDisplay.setDirections({routes: []});

        // TODO move UI interaction into its own module
        $('.result').removeClass('success');
        $('#notice').removeClass('error').empty();
        $('#info .location, #info .notes').empty();
        $('#directions-link').removeAttr('href');
    }

    /*function iterates through the geoJSON containing cambridge precincts (districts) and if address geo data (lat lng) is within one of these districts returns the district.*/
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

    //this function returns an URI to the destination and appends this url to the <a> button href attribute so users can open this on their device maps app.
    function getDirections(destination) {
        var url;
        if (navigator.userAgent.match(/iPhone|iPad|iPod/)) {
            url = "http://maps.apple.com/?saddr=Current+Location&daddr=";
        } else {
            url = "https://maps.google.com/maps?daddr=";
        }
        
        //Javier: checking to see the getDirection URL
        var encodedURI = encodeURI(url + destination);
        console.log("javier, this is the destination", encodedURI);
        
        return encodeURI(url + destination);
    }

    return function(latLng, successCallback, errorCallback) {
        
        
        clearPreviousResults();
        userPrecinct = getUserPrecinct(latLng);
        if (!userPrecinct) {
            $('#notice')
                .addClass('error')
                .text("We can't find your precinct! Sorry. Try again?");
        } else {
            var pollingLocation = getPollingLocation(userPrecinct);
            
            console.log('polling location');
            console.log(pollingLocation);
            
            $('.result').addClass('success');
            showResults();
            // highlight the precinct on the map
            userPrecinct.setMap(map);
            map.fitBounds(userPrecinct.getBounds());

            // display location notes
            $('#info .location').text(pollingLocation.geojsonProperties.LOCATION);
            $('#info .notes').text(pollingLocation.geojsonProperties.LOCATION_NOTE);

            // show step-by-step directions
            var destination = pollingLocation.geojsonProperties.Address + ', Cambridge, MA';
            var request = {
                origin: latLng,
                destination: destination,
                travelMode: google.maps.TravelMode.WALKING
            };
            directionsService.route(request, function(result, status) {
                if (status === google.maps.DirectionsStatus.OK) {
                    directionsDisplay.setDirections(result);
                    if(successCallback) {
                        successCallback({result: result, status: status});
                    }
                } else {
                    if(errorCallback) {
                        errorCallback({result: result, status: status});
                    }
                }
            });

            $('#directions-link').attr('href', getDirections(destination));
        }
    };
});
