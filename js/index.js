$('.message a').click(function(){
   $('form').animate({height: "toggle", opacity: "toggle"}, "slow");
});

var nightshiftParameters = {
  shiftOne: {
    startTime: {
      twentyFourHour: 200,
      withColons: '2:00'},
    
    finishTime: {
      twentyFourHour: 1700,
      withColons: '17:00'}},
  
  shiftTwo: {
    startTime: {
      twentyFourHour: 1700,
      withColons: '17:00'},
    
    finishTime: {
      twentyFourHour: 2000,
      withColons: '20:00'}},
    
  secondsInDay: 60 * 60 * 24}

// DATE MAGIC
var today = new Date();

// returns 1-7 for Monday to Sunday
var dayNumber = today.getDay();

// returns the day of the month, e.g. 27.
var dd = today.getDate();

// returns the current month, indexed at 0, so +1 for real answer
var mm = today.getMonth() + 1;

// returns the year, e.g. 2018.
var yyyy = today.getFullYear();

// if the date is any single digit, add a leading 0, so the day is always 2 digits long.
if (dd < 10) {
  dd = "0" + dd;
}

// as above, but for the month value.
if (mm < 10) {
  mm = "0" + mm;
}

// join together, e.g. 27.11.2018.
today = dd + "." + mm + "." + yyyy; 
// END DATE MAGIC
  
var realtimeCommands = ['realtimeShiftCommand -r"',
                        // fleet number goes here
                        '" -d"AUSQLD ',
                        today,
                        '" -R"AUSQLD ',
                        nightshiftParameters.shiftOne.startTime.withColons,
                        ' -AUSQLD ',
                        nightshiftParameters.shiftOne.finishTime.withColons,
                        '" -!"PRMT3"']

var shiftOneCommands = ['resCalendar  -a"AddItem" -r"',
                        // fleet number goes here
                        '" -d"',
                        today,
                        '" -s"AUSQLD,',
                        calculateShiftTime(1),
                        '" -u"0"'];

var shiftTwoCommands = ['resCalendar  -a"AddItem" -r"',
                        // fleet number goes here
                        '" -d"',
                        today,
                        '" -n"2" -s"AUSQLD,',
                        calculateShiftTime(2),
                        '" -u"0" -c"NIGHT SHIFT" -H"1" -!"NIGHT,PRMT3"'];

var reuseOnCommands = ['vc -v"',
                       // fleet number goes here
                       '" -^"1"'];

var reuseOffCommands = ['vc -v"',
                        // fleet number goes here
                        '" -^"0"'];

var undoRealtimeCommands = ['realtimeShiftCommand -r"',
                            // fleet number goes here
                            '" -d"AUSQLD ',
                            today,
                            '" -x"1" -!""']

var undoShiftTwoCommands = ['resCalendar  -a"UpdateItem" -r"',
                            // fleet number goes here
                            '" -d"',
                            today,
                            '" -n"2" -s"unset" -c"unset" -H"unset" -!"unset"']

var undoShiftOneCommands = ['resCalendar  -a"UpdateItem" -r"',
                            '" -d"',
                            today,
                            '" -n"1" -s"unset"']

// SHIFT TIME CALCULATION MAGIC
// Input a shift number, either 1 or 2, and return a two-item array of shift times.
function calculateShiftTime(shiftNumber){
  if (shiftNumber == 1) {
    
    // calculate number of seconds since 12 AM Sunday until shift times.
    var timeArray = [(nightshiftParameters.shiftOne.startTime.twentyFourHour * 36) + (nightshiftParameters.secondsInDay * dayNumber),
                     (nightshiftParameters.shiftOne.finishTime.twentyFourHour * 36) + (nightshiftParameters.secondsInDay * dayNumber)]
  }
  else if (shiftNumber == 2) {
    var timeArray = [(nightshiftParameters.shiftTwo.startTime.twentyFourHour * 36) + (nightshiftParameters.secondsInDay * dayNumber),
                     (nightshiftParameters.shiftTwo.finishTime.twentyFourHour * 36) + (nightshiftParameters.secondsInDay * dayNumber)]
  }
  else console.log("Invalid shift number!")
  
  // returns an array of two times, start and finish, e.g. 93600,148700
  return timeArray
}
// END START TIME CALCULATION MAGIC

function tesysJoin(trucks, commands) {
  let tempArray = trucks.slice(0);
  let tempCommands = commands.slice(0);
  let firstCommand = tempCommands.shift();
  
  for (let i = 0; i < tempArray.length; i++) {
    tempArray[i] =
      firstCommand +
      tempArray[i] +
      tempCommands.join('');
  }

  output = tempArray.join("\r\n")
  return output
}

// SAVE FILE BUTTON
$("#btn-save").click(function() {
  let input = $("#input-truckList").val();
  let truckList = input.split(" ");
  for(var i=0;i<truckList.length;i++){
    truckList[i]="PCA"+truckList[i];
  }
  
  let outputFile = [
    tesysJoin(truckList, realtimeCommands),
    tesysJoin(truckList, shiftOneCommands),
    tesysJoin(truckList, shiftTwoCommands),
    tesysJoin(truckList, reuseOnCommands),
    tesysJoin(truckList, reuseOffCommands)
  ].join("\r\n")
  
  var filename = "Apply night shift for " + today;
  var blob = new Blob([outputFile], { type: "cmd" });
  saveAs(blob, filename + ".cmd");
  
  document.getElementById('result').innerHTML = outputFile;
});

// SAVE FILE BUTTON
$("#btn-undo").click(function() {
  let input = $("#input-truckList").val();
  let truckList = input.split(" ");
  for(var i=0;i<truckList.length;i++){
    truckList[i]="PCA"+truckList[i];
  }
  
  let outputFile = [
    tesysJoin(truckList, undoRealtimeCommands),
    tesysJoin(truckList, undoShiftTwoCommands),
    tesysJoin(truckList, undoShiftOneCommands),
    tesysJoin(truckList, reuseOnCommands),
    tesysJoin(truckList, reuseOffCommands)
  ].join("\r\n")
  
  var filename = "Undo night shift for " + today;
  var blob = new Blob([outputFile], { type: "cmd" });
  saveAs(blob, filename + ".cmd");
  
  document.getElementById('result').innerHTML = outputFile;
});