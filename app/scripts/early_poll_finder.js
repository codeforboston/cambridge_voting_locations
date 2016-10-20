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
            
			//setting a reference to the googleMaps map that is privately held in polling_location_finder. We have to fix this.
            map = window.googleMap;
			
			//populates the polls dictionary creating a poll object for each from the geojson data.
            earlyPolls.forEach(function(geoJsonObject, index){
                
                var currentLabel = labels[index % labels.length];
				
                //creates the polls dictionary and adds an object for each poll to the corresponding label value.
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
				
				//create reference to current poll object
				var currentPoll = polls[currentLabel];
                
                currentPoll.marker = new google.maps.Marker({
                    position: {lat: currentPoll.lat, lng: currentPoll.lng},
                    label: currentLabel,
                    animation: google.maps.Animation.DROP
                });
                
                //add listeners for each marker, wish I could delegate instead of attaching a listener to each.
                currentPoll.marker.addListener('click', function(evt){
                    collapseAll();    
                    map.setZoom(18);
                    map.setCenter(currentPoll.marker.getPosition());
                    expandCard(currentLabel);
                });
                
                createTable(currentPoll);
               	currentPoll.status = getStatus(currentLabel);
                
            });
			
			//once markers have been created for each poll object, show them on the map        
            showMarkers();
            
			//populates each poll info card div with table of hours and status.
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
			
			//adds the listener to expand or collapse each poll card
			$polls.on('click', function(e){
                var $pollClicked = $(e.target).closest('div'),
					pollLabel = "";
                    $pollClicked.toggleClass('poll-card-active');  
					pollLabel = $pollClicked.find('h3').html().slice(0,1);
					if($pollClicked.hasClass('poll-card-active')){
					   	map.setCenter(polls[pollLabel].marker.getPosition());
						map.setZoom(18);
			        }
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
			//adds the class to the specified poll as to expand them.
            polls[label].cardPointer.addClass('poll-card-active');
            return this;
        }
    
        function collapseAll(){
			//removes the class of all elements so collapse them
            $polls.children('.poll-card').removeClass('poll-card-active');
            return this;
        }
    
        function showMarkers(){
			
            //iterates through the polls dictionary and set the map for each marker
            for(var poll in polls){
                var currentPoll = polls[poll];
                currentPoll.marker.setMap(map);
            }
			
			//sets map zoom and center to show all the markers in view.
			map.setCenter({lat: 42.3800, lng: -71.1106});	
			map.setZoom(14);
			
            return this;  
        }
        
        function hideMarkers(){
            
			//iterates through the polls dictionary and set the map to null on each marker
            for(var poll in polls){
                var currentPoll = polls[poll];
                currentPoll.marker.setMap(null);
            }
			
			//sets the zoom and map center to default values to be used in the poll election day tab
			map.setCenter({lat: 42.3736, lng: -71.1106});	
			map.setZoom(12);

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
            hideMarkers : hideMarkers,
			hasInitialized : function(){
				return initialized;
			} 
        };
        	
	
});
