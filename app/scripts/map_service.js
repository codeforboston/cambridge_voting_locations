define(['geojson', 
        'json!vendor/EARLY_VOTING_AddressPoints.geojson'], 
        function(GeoJSON,  earlyPollingJSON) {

    var DEFAULT_ZOOM_LEVEL = 13;
    var DEFAULT_CENTER_POSITION = new google.maps.LatLng(42.3736, -71.1106) // Cambridge

	var earlyPollingLocations = new GeoJSON(earlyPollingJSON);

    var map = new google.maps.Map(document.getElementById('map'), {
        center: DEFAULT_CENTER_POSITION,
        zoom: DEFAULT_ZOOM_LEVEL
    });


    var directionsService = new google.maps.DirectionsService(),
        directionsDisplay = new google.maps.DirectionsRenderer({
            map: map,
            preserveViewport: true,
            panel: document.getElementById('directions')
        });

    var userInputs = {
    	"precinct": null,
    	"homeAddress": null,
    	"destination": null
    }

  	var earlyPollingMarkers = [];


    function createEarlyPollingMarkers() {

        for (var i = 0; i < earlyPollingLocations.length; i++) {
   
            var pos = new google.maps.LatLng(earlyPollingLocations[i].position.lat(),
                                             earlyPollingLocations[i].position.lng());

            var earlyVotingMarker = new google.maps.Marker({
                position: pos,
                map: map
            });

            earlyPollingMarkers.push(earlyVotingMarker);

        }

    }


 
    // var userInputs.precinct;

    function clearPreviousResults() {
    	// console.log("USER", userInputs.precinct);
	    if (userInputs.precinct) {
	        userInputs.precinct.setMap(null);
	        userInputs.precinct = undefined;
	    }
	    directionsDisplay.setDirections({routes: []});

	    // TODO move UI interaction into its own module
	    $('.result').removeClass('success');
	    $('#notice').removeClass('error').empty();
	    $('#info .location, #info .notes').empty();
	    $('#directions-link').removeAttr('href');
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

    function displayDirections(latLng, destination, successCallback, errorCallback) {
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



    return {


	    clearMap: function() {

	    	for (var i = 0; i < earlyPollingMarkers.length; i++) {
	    		earlyPollingMarkers[i].setMap(null);
	    	}
	    },


    	displayEarlyPollingMarkers: function() {


    		map.setCenter(DEFAULT_CENTER_POSITION);
  			map.setZoom(DEFAULT_ZOOM_LEVEL);

  			clearPreviousResults();
    		if (earlyPollingMarkers.length <= 0) {
    			createEarlyPollingMarkers();
    		} else {
    			for (var i = 0; i < earlyPollingMarkers.length; i++) {
    				earlyPollingMarkers[i].setMap(map);
    			}
    		}

    	},

    	displayUserPollingPlace: function() {
    		    		console.log("user", userInputs.precinct);
    		this.clearMap();

    		if (userInputs.precinct) {

	    		userInputs.precinct.setMap(map);
	    		map.fitBounds(userPrecint.getBounds());
	    		displayDirections(latLng, destination, successCallback, errorCallback);

    		}




    	},

    	displayNewPollingPlace: function(latLng, destination, precinct, successCallback, errorCallback) {
    	
    		this.clearMap();
    		clearPreviousResults();
    		userInputs.precinct = precinct;
    		userInputs.precinct.setMap(map);


           
           	map.fitBounds(userInputs.precinct.getBounds());

 			displayDirections(latLng, destination, successCallback, errorCallback);

    	},

    	getMap: function() {
    		return map;
    	}



    // console.log("map", map, precincts, pollingLocations, earlyPollingLocations);

    };


});