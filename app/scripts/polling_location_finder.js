define(['jquery', 'geojson', 'json!vendor/ELECTIONS_WardsPrecincts.geojson', 'json!vendor/ELECTIONS_PollingLocations.geojson', 'moment', 'momentrange'], function($, GeoJSON, precinctsJSON, locationsJSON, moment, momentRange) {
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
        $('.voting-result').show();
    }

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
    
    
    
        
    
    //pseudo pollstatio geoJson object to test polling station info card.
    
    var pollLocation = {
        geojsonProperties : {
            W_P: "2-3",
            LOCATION_NOTE: "Kresge Auditorium, behind Stratton Center",
            LOCATION: "M.I.T.",
            GlobalID: "{CFCFA376-F4B0-4361-800E-A5EA71E31790}",
            Address: "70 Massachusetts Ave",
            hours: [ "2016-10-24T18:00:00.000Z/2016-10-25T00:00:00.000Z",
          "2016-10-25T13:00:00.000Z/2016-10-25T21:00:00.000Z",
          "2016-10-26T18:00:00.000Z/2016-10-27T00:00:00.000Z",
          "2016-10-27T13:00:00.000Z/2016-10-27T21:00:00.000Z",
          "2016-10-28T13:00:00.000Z/2016-10-28T21:00:00.000Z",
          "2016-10-29T13:00:00.000Z/2016-10-29T21:00:00.000Z",
          "2016-10-31T18:00:00.000Z/2016-11-01T00:00:00.000Z",
          "2016-11-01T13:00:00.000Z/2016-11-01T21:00:00.000Z",
          "2016-11-02T18:00:00.000Z/2016-11-03T00:00:00.000Z",
          "2016-11-03T13:00:00.000Z/2016-11-03T21:00:00.000Z",
          "2016-11-04T13:00:00.000Z/2016-11-04T21:00:00.000Z" ]
        }
    };
	
	var pollingHours = ["2016-10-24T18:00:00.000Z/2016-10-25T00:00:00.000Z",
          "2016-10-25T13:00:00.000Z/2016-10-25T21:00:00.000Z",
          "2016-10-26T18:00:00.000Z/2016-10-27T00:00:00.000Z",
          "2016-10-27T13:00:00.000Z/2016-10-27T21:00:00.000Z",
          "2016-10-28T13:00:00.000Z/2016-10-28T21:00:00.000Z",
          "2016-10-29T13:00:00.000Z/2016-10-29T21:00:00.000Z",
          "2016-10-31T18:00:00.000Z/2016-11-01T00:00:00.000Z",
          "2016-11-01T13:00:00.000Z/2016-11-01T21:00:00.000Z",
          "2016-11-02T18:00:00.000Z/2016-11-03T00:00:00.000Z",
          "2016-11-03T13:00:00.000Z/2016-11-03T21:00:00.000Z",
          "2016-11-04T13:00:00.000Z/2016-11-04T21:00:00.000Z" ];
    
    /*module to display polling station hours*/
    var pollInfoModule = (function(){
        var _pollDiv = $('#stationInfo'),
            _message = "",
            _now,
            _pollingDay = {
                startingHour: '',
                endingHour: '',
                isToday : false
            },
            _pollOpen,
            _infoTable;
        
        
        function init(pollHours){
            
            //_now = moment();
            
                //dev made up now moment object for debugging purposes.
            _now = moment({ years:2016, months:09, date:31, hours:12, minutes:31, seconds:3, milliseconds:123});
            //default message
            _message = "Hello there dear citizen, glad to see you take part in our democracy! Have a nice polling day.";
            _pollingDay.isToday = false;
            _pollOpen = false;
            _infoTable = '<tr><th>Dates</th><th>Times</th></tr>';
            
            //interates through each start and end hour time in the polling station.
                for(var i=0, j=pollHours.length; i<j; i++){
                    var _startingHour,
                        _endingHour;

                    //get the moment object of the start and end hours for that particular day.
                    _startingHour = moment(pollHours[i].slice(0, 24));
                    _endingHour = moment(pollHours[i].slice(-24));
					
					console.log(pollHours[i].slice(-24));

                    //if the current moment is within the start and end hours of the current poll day. That means poll is open.
                    if(_now.isBetween(_startingHour.format(), _endingHour.format())){
                        _pollingDay.startingHour = _startingHour.clone();
                        _pollingDay.endingHour = _endingHour.clone();
                        _pollingDay.isToday = true;
                    }
                    //no need to draw dates that have already passed!!
                    if(!_now.isAfter(_startingHour.format(), 'day')){
                        
                        _infoTable += (
                        '<tr><td>' + _startingHour.format('dddd, MMM Do') + '</td>' +
                            '<td>' + _startingHour.format('hA') + '-' + _endingHour.format('hA') + '</td>' +
                        '</tr>');     
                    }

                }
            
            //it is set to open if today within the bounds of start and end hours of the poll.
            _pollOpen = (_pollingDay.isToday)? true : false;
            //displays time.
            _message += " Today is " + _now.format('dddd, MMM Do, h:m a');
            
                if(_pollOpen){
                    //also check if it is not closing within minutes!
                    if(_now.to(_pollingDay.endingHour).slice(-7) === "minutes"){
                        _pollDiv.find('span.poll-status').addClass('closing').html('CLOSING SOON');
                        _message += ". And better hurry, this poll will be closing soon!!";
                    }else{
                        _message += ". Poll is open, don't forget your ID!";
                        _pollDiv.find('span.poll-status').addClass('open').html('OPEN');   
                    }
                }else{
                    //if it is not open set status to close and warn user.
                    _message += ". It seems this poll is currently closed check hours below.";
                    _pollDiv.find('span.poll-status').addClass('closed').html('CLOSED');   
                }
            
            //attach message
             _pollDiv.find('p').html(_message);
    
        }
        
    
        return{
            init : init,
            get isOpen (){
                return moment().isBetween(_pollingDay.startingHour.format(), _pollingDay.endingHour.format());
            },
            hide: function(){
              _pollDiv.hide();  
            },
            render : function(){
                _pollDiv.show();
                _pollDiv.find('table').html(_infoTable);
            }
        }
        
    })();
    
    


    return function(latLng, successCallback, errorCallback) {
        
        
        clearPreviousResults();
        userPrecinct = getUserPrecinct(latLng);
        if (!userPrecinct) {
            $('#notice')
                .addClass('error')
                .text("We can't find your precinct! Sorry. Try again?");
        } else {
            var pollingLocation = getPollingLocation(userPrecinct);
            
            if(pollingHours){
            pollInfoModule.init(pollingHours);
            pollInfoModule.render();
            }else{
                console.log('current polling geojson object does not have property of hours to display!');   
            }
            
            
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
