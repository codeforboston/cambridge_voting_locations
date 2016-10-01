define(['jquery', 'geojson', 'moment', 'moment_range', 'moment_timezone',
        'json!vendor/ELECTIONS_WardsPrecincts.geojson',
        'json!vendor/ELECTIONS_PollingLocations.geojson',
        'json!vendor/EARLY_VOTING_AddressPoints.geojson'], 
    function($, GeoJSON, moment, moment_range, moment_timezone, 
            precinctsJSON, locationsJSON, earlyPollingJSON) {
    'use strict';

    var precincts = new GeoJSON(precinctsJSON),
        pollingLocations = new GeoJSON(locationsJSON),
        earlyPollingLocations = new GeoJSON(earlyPollingJSON);

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

    function getHours(place) {

        var hours = [];
        moment.tz.add('America/New_York|EST EDT|50 40|0101|1Lz50 1zb0 Op0');
        
        jQuery.each(place, function(index, timeInterval) {
            var range = moment.range(timeInterval);
            var dates = range.toDate();
            dates = dates.map(function(d) { 
                return moment(d).tz('America/New_York').format('MMM Do h:mma z')
            });

            hours.push(dates);
          //  $('<li>').append(dates[0]).append(' to ').append(dates[1]).appendTo('#'+key);
         });

        return hours;
    }

    function displayEarlyPollingLocations() {

        var earlyPollingInfoWindow = new google.maps.InfoWindow;

        for (var i = 0; i < earlyPollingLocations.length; i++) {
   
            var pos = new google.maps.LatLng(earlyPollingLocations[i].position.lat(),
                                             earlyPollingLocations[i].position.lng());

            var addr = earlyPollingLocations[i].geojsonProperties.Full_Addr;

            var hours = earlyPollingLocations[i].geojsonProperties.hours;

            var listed_hours = getHours(hours);
            createEarlyVotingMarker(pos, i, addr, listed_hours);
        }
    }

    function generateHoursHTML(listed_hours) {
        var hoursHTML = "";
        for (var i = 0; i < listed_hours.length; i++) {
            hoursHTML += "<li>" + listed_hours[i][0] + " to " + listed_hours[i][1] + "</li>";
        }
        return hoursHTML;

    }

    function createEarlyVotingMarker(pos, index, addr, listed_hours) {

        var earlyVotingMarker = new google.maps.Marker({
            position: pos,
            map: map
        });

        var earlyVotingInfoWindow = new google.maps.InfoWindow();

        var earlyVotingInfo = document.createElement("ul");
        earlyVotingInfo.id = "earlyVotingInfoDiv";

        var hoursHTML = generateHoursHTML(listed_hours);
        earlyVotingInfo = "Early Polling Location: " +  addr + hoursHTML;

        google.maps.event.addListener(earlyVotingMarker, 'click', (function(earlyVotingInfo, index) {
            return function() {
                earlyVotingInfoWindow.setContent(earlyVotingInfo);
                earlyVotingInfoWindow.open(map, this);
            }
        })(earlyVotingInfo, index));    
    }

    return function(latLng) {
        clearPreviousResults();

        // display early voting locations
        displayEarlyPollingLocations();

        userPrecinct = getUserPrecinct(latLng);
        if (!userPrecinct) {
            $('#notice')
                .addClass('error')
                .text("We can't find your precinct! Sorry. Try again?");
        } else {
            var pollingLocation = getPollingLocation(userPrecinct);
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
                }
            });

            $('#directions-link').attr('href', getDirections(destination));
        }
    };
});
