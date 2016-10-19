define(['jquery', 'geojson', 'json!vendor/EARLY_VOTING_AddressPoints.geojson', 'moment', 'momentrange'], function($, GeoJSON, earlyPollJSON,  moment, momentRange) {
    'use strict';
	
	var earlyPolls = new GeoJSON(earlyPollJSON);
	
	
	//the type of input that the module expects
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
            //actual time
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
				var table = document.createElement('div');
                _pollDiv.show();
                _pollDiv.find('table').html(_infoTable);
            }
        }
        
    })();
	
	
	
	
	
});
