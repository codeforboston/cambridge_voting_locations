define(['jquery', 'geojson', 'json!vendor/EARLY_VOTING_AddressPoints.geojson', 'moment', 'momentrange'], function($, GeoJSON, earlyPollJSON,  moment, momentRange) {
    'use strict';
	
	var earlyPolls = new GeoJSON(earlyPollJSON);

    var $polls = $('#polls'),
            _now,
            initialized = false,
            labels = "ABCDEFG",
            map,
            polls = {};
        
        function init(){
            
            if(initialized) return;
            initialized = true;
            
            //dev made up now moment object for debugging purposes.
           // _now = moment({ years:2016, months:09, date:31, hours:12, minutes:31, seconds:3, milliseconds:123});
			_now = moment();
            
            map = window.googleMap;

            $polls.on('click', function(e){
                var $pollClicked = $(e.target).closest('div');
                    $pollClicked.toggleClass('poll-card-active');  
                });
            
            
            earlyPolls.forEach(function(geoJsonObject, index){
                
                var currentLabel = labels[index % labels.length];
                //create a property equal to the marker label
                polls[currentLabel] = {
                        startingHour: '',
                        endingHour: '',
                        status : "closed",
                        isToday : false,
                        isOpen : false,
                        lat : geoJsonObject.position.lat(),
                        lng : geoJsonObject.position.lng(),
                        title : currentLabel + ": " +geoJsonObject.geojsonProperties.StName,
                        table : "",
                        URI : getAddressURI(geoJsonObject.geojsonProperties.Full_Addr + "Cambridge, MA"),
                        hoursArray : geoJsonObject.geojsonProperties.hours
                      };
                
                polls[currentLabel].marker = new google.maps.Marker({
                    position: {lat: polls[currentLabel].lat, lng: polls[currentLabel].lng},
                    label: currentLabel,
                    animation: google.maps.Animation.DROP
                });
                
                
                polls[currentLabel].marker.addListener('click', function(evt){
                    collapseAll();    
                    map.setZoom(18);
                    map.setCenter({lat: evt.latLng.lat(), lng: evt.latLng.lng()});
                    expandCard(currentLabel);
                });
                
                
                createTable(polls[currentLabel]);
                polls[currentLabel].status = getStatus(currentLabel);
                
            });
            
            showMarkers();
            
            $polls.children('.poll-card').each(function(index){
                
                var $pollCard = $(this),
                    currentPoll = polls[labels[index % labels.length]],
                    $pollcardHeader =  $pollCard.children('.poll-header');
                
                currentPoll.cardPointer = $pollCard;
                $pollCard.find('table').html(currentPoll.table);
                $pollCard.find('.maps-app-link').attr('href', currentPoll.URI);
                $pollcardHeader.children('h3').html(currentPoll.title);
                $pollcardHeader.children('.poll-status').addClass(currentPoll.status).html(currentPoll.status);
            });
            
        }
    
        function createTable(pollObject){
            
            var _infoTable = "",
                pollHours = pollObject.hoursArray;
                
			pollObject.status = "closed";
            pollObject.isToday = false;
            pollObject.isOpen = false;
            _infoTable = '<tr><th>Dates</th><th>Times</th></tr>';
            
            //interates through each start and end hour time in the polling station.
                for(var i=0, j=pollHours.length; i<j; i++){
                    var _startingHour,
                        _endingHour;

                    //get the moment object of the start and end hours for that particular day.
                    _startingHour = moment(pollHours[i].slice(0, 24));
                    _endingHour = moment(pollHours[i].slice(-24));
                    //if the current moment is within the start and end hours of the current poll day. That means poll is open.
                    if(_now.isBetween(_startingHour.format(), _endingHour.format())){
                        pollObject.startingHour = _startingHour.clone();
                        pollObject.endingHour = _endingHour.clone();
                        pollObject.isToday = true;
                        pollObject.isOpen = true;
                    }
                    //no need to draw dates that have already passed!!
                    if(!_now.isAfter(_startingHour.format(), 'day')){
                 	//return a table of all the times and dates from today on.
                        _infoTable += (
                        '<tr><td>' + _startingHour.format('dddd, MMM Do') + '</td>' +
                            '<td>' + _startingHour.format('hA') + '-' + _endingHour.format('hA') + '</td>' +
                        '</tr>');     
                    }

                }
            
            pollObject.table = _infoTable;
            
            return pollObject.table;
            
        }

        function getStatus(label){
            
            var pollObject = polls[label];
			
			   if(pollObject.isOpen){
                    //also check if it is not closing within minutes!
                    if(_now.to(pollObject.endingHour).slice(-7) === "minutes"){
						pollObject.status = "closing";
                    }else{
						pollObject.status = "open";   
                    }
                }else{
					pollObject.status = "closed"; 
                }
			
			return pollObject.status;
			
		}
    
        function isOpen(label){
        
            var pollObject = polls[label];
            
            return (pollObject.isToday? moment().isBetween(pollObject.startingHour.format(), pollObject.endingHour.format()) : false);
            
        }

        function expandCard(label){
            polls[label].cardPointer.addClass('poll-card-active');
            return this;
        }
    
        function collapseAll(){
            $polls.children('.poll-card').each(function(index){
               $(this).removeClass('poll-card-active'); 
            });
            return this;
        }
    
        function showMarkers(){
            
            
            
            
            for(var poll in polls){
                
                var currentPoll = polls[poll];
                
                currentPoll.marker.setMap(map);
                
            }
            
            return this;
            
            
        }
        
        function hideMarkers(){
            
            for(var poll in polls){
                
                var currentPoll = polls[poll];
                
                currentPoll.marker.setMap(null);
                
            }
            
            return this;
            
            
        }
    
        function getAddressURI(destination) {
        var url;
        if (navigator.userAgent.match(/iPhone|iPad|iPod/)) {
            url = "http://maps.apple.com/?saddr=Current+Location&daddr=";
        } else {
            url = "https://maps.google.com/maps?daddr=";
        }
        
        var encodedURI = encodeURI(url + destination);
        return encodeURI(url + destination);
		
        }
    
    
            return {
            init : init,
            show : function(){
                $polls.show();
                return this;
            },
            hide : function(){
                $polls.hide();
                return this;
            },
            isOpen : isOpen,
			getTime : function(){
				return _now.format('dddd, MMM Do, h:m a '); 
			},
            collapseAll : collapseAll,
            expandCard : expandCard,
			getStatus: getStatus,
            showMarkers : showMarkers,
            hideMarkers : hideMarkers
            
        };
        	
	
});
