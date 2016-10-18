define(['jquery', 'geojson', 'moment',   
		'json!vendor/EARLY_VOTING_AddressPoints.geojson',  
        'moment_range', 'moment_timezone'], 
    function ($, GeoJSON, moment, earlyPollingJSON) {

	'use strict';


	var earlyPollingLocations = new GeoJSON(earlyPollingJSON);


    var earlyPollingMap = new google.maps.Map(document.getElementById('earlyPollingMap'), {
        center: new google.maps.LatLng(42.3736, -71.1106), // Cambridge!
        zoom: 12
    });



    function displayMarkers() {

        for (var i = 0; i < earlyPollingLocations.length; i++) {
   
            var pos = new google.maps.LatLng(earlyPollingLocations[i].position.lat(),
                                             earlyPollingLocations[i].position.lng());

			var earlyVotingMarker = new google.maps.Marker({
				position: pos,
				map: earlyPollingMap
			});            

        }
        console.log("MAP", earlyPollingMap);
    }



	return function (successCallback, errorCallback) {
		displayMarkers();
	};


});