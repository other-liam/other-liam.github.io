$('.message a').click(function(){
   $('form').animate({height: "toggle", opacity: "toggle"}, "slow");
});

// SHIFT TIMES
// can't use 0200 because JS hates leading 0s
var shiftOneStartTime = 200;
var shiftOneEndTime = 1700;
var shiftTwoStartTime = 1700;
var shiftTwoEndTime = 2000;

// Tesys sets 12 AM Sunday as reference point. i.e. 2 AM Monday is +26 hours, and so on.
var numberOfSecondsInDay = 60 * 60 * 24;
                                         
// TESYS COMMANDS
// Cut back realtime shift to 2:00 - 17:00, add PRMT3 property
var rtShiftCommand = 'realtimeShiftCommand -r"';
var rtRegion = '" -d"AUSQLD ';
var rtCutbackAndPermit = '" -R"AUSQLD 2:00 -AUSQLD 17:00" -!"PRMT3"';

// Cut back shift 1 to 2:00 - 17:00
var calChange = 'resCalendar  -a"AddItem" -r"';
var calDateChange = '" -d"';
var calShiftOneChange = '" -s"AUSQLD,';
var endAdjustment = '" -u"0"'

// Create shift 2 as 17:00 - 20:00, add PRMT3 + NIGHT properties
var calShiftTwoChange = '" -n"2" -s"AUSQLD,';
var calPermits = '" -u"0" -c"NIGHT SHIFT" -H"1" -!"NIGHT,PRMT3"';

// Re-use on
var reuse = 'vc -v"';
var reuseOn = '" -^"1"';

// Re-use off
var reuseOff = '" -^"0"';

// Undo
var rtUndo = '" -x"1" -!""'
var calUndo = 'resCalendar  -a"UpdateItem" -r"'
var calSecondShiftUndo = '" -n"2" -s"unset" -c"unset" -H"unset" -!"unset"'
var calFirstShiftUndo = '" -n"1" -s"unset"'

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

// START TIME CALCULATION MAGIC
// Input a shift number, either 1 or 2, and return a two-item array of shift times.
function calculateShiftTime(shiftNumber){
  if (shiftNumber == 1) {
    
    // calculate number of seconds since 12 AM Sunday until shift times.
    var timeArray = [(shiftOneStartTime * 36) + (numberOfSecondsInDay * dayNumber),
                     (shiftOneEndTime * 36) + (numberOfSecondsInDay * dayNumber)]
  }
  else if (shiftNumber == 2) {
    var timeArray = [(shiftTwoStartTime * 36) + (numberOfSecondsInDay * dayNumber),
                     (shiftTwoEndTime * 36) + (numberOfSecondsInDay * dayNumber)]
  }
  else console.log("Invalid shift number!")
  
  // returns an array of two times, start and finish, e.g. 93600,148700
  return timeArray
}
// END START TIME CALCULATION MAGIC

// SAVE FILE BUTTON
$("#btn-save").click(function() {
  // get list of trucks from HTML input
  var unformattedTruckList = $("#input-truckList").val();
  
  // assume delimited by a space, split into array
  var truckArray = unformattedTruckList.split(" ");
  
  for(var i=0;i<truckArray.length;i++){
    // add 'PCA' prefix to each item in array for full fleet number.
    truckArray[i]="PCA"+truckArray[i];
  }
  
  // CUT BACK REALTIME SHIFT
  // copy truckArray into seperate array
  var arrayOfTrucksForRealtime = truckArray.slice(0);
  
  // pasting all the Tesys commands together with the fleet number.
  for (var i = 0; i < arrayOfTrucksForRealtime.length; i++) {
    arrayOfTrucksForRealtime[i] =
      rtShiftCommand +
      arrayOfTrucksForRealtime[i] +//
      rtRegion +
      today +
      rtCutbackAndPermit;
  }
  
  // turn the array of Tesys commands into a list for exporting, delimited by a new line.
  var listOfRealtimeCutbackCommands = arrayOfTrucksForRealtime.join("\r\n");
  
  // CUT BACK SHIFT 1
  var arrayOfTrucksForShiftOne = truckArray.slice(0);
  for (var i = 0; i < arrayOfTrucksForShiftOne.length; i++) {
    arrayOfTrucksForShiftOne[i] =
      calChange +
      arrayOfTrucksForShiftOne[i] +
      calDateChange +
      today +
      calShiftOneChange +
      
      // using the function to convert shift 1 times into seconds
      calculateShiftTime(1) +
      
      endAdjustment;
  }
  
  var listOfShiftOneChangeCommands = arrayOfTrucksForShiftOne.join("\r\n");
  
  // CREATE SHIFT 2
  var arrayOfTrucksForShiftTwo = truckArray.slice(0);
  for (var i = 0; i < arrayOfTrucksForShiftTwo.length; i++) {
    arrayOfTrucksForShiftTwo[i] =
      calChange +
      arrayOfTrucksForShiftTwo[i] +
      calDateChange +
      today +
      calShiftTwoChange +
      calculateShiftTime(2) +
      calPermits;
  }
  
  var listOfShiftTwoCommands = arrayOfTrucksForShiftTwo.join("\r\n");
  
  // RE-USE ON
  var arrayOfTrucksForReuseOn = truckArray.slice(0);
  for (var i = 0; i < arrayOfTrucksForReuseOn.length; i++) {
    arrayOfTrucksForReuseOn[i] =
      reuse +
      arrayOfTrucksForReuseOn[i] +
      reuseOn;
  }
  
  var listOfReuseOnCommands = arrayOfTrucksForReuseOn.join("\r\n");
  
  // RE-USE OFF
  var arrayOfTrucksForReuseOff = truckArray.slice(0);
  for (var i = 0; i < arrayOfTrucksForReuseOff.length; i++) {
    arrayOfTrucksForReuseOff[i] =
      reuse +
      arrayOfTrucksForReuseOff[i] +
      reuseOff;
  }
  
  var listOfReuseOffCommands = arrayOfTrucksForReuseOff.join("\r\n");
  
  // join all lists into an array, then join that array, delimited by a new line.
  var outputArray = [
    listOfRealtimeCutbackCommands,
    listOfShiftOneChangeCommands,
    listOfShiftTwoCommands,
    listOfReuseOnCommands,
    listOfReuseOffCommands
  ].join("\r\n");
  
  var filename = "Apply night shift for " + today;
  var blob = new Blob([outputArray], { type: "cmd" });
  saveAs(blob, filename + ".cmd");
  
  // send contents of file to HTML output for easy viewing
  document.getElementById('result').innerHTML = outputArray;});

$("#btn-undo").click(function() {
  
  var unformattedTruckList = $("#input-truckList").val();
  var truckArray = unformattedTruckList.split(" ");
  for(var i=0;i<truckArray.length;i++){
    truckArray[i]="PCA"+truckArray[i];
  }
  
  // undo the cutting back of the realtime shift
  var undoArrayOfTrucksForRealtime = truckArray.slice(0);
  for (var i = 0; i < undoArrayOfTrucksForRealtime.length; i++) {
    undoArrayOfTrucksForRealtime[i] =
      rtShiftCommand +
      undoArrayOfTrucksForRealtime[i] +
      rtRegion +
      today +
      rtUndo;
  }
  
  var listOfUndoRealtimeCutbackCommands = undoArrayOfTrucksForRealtime.join("\r\n");
  
  // CLEAR 2ND SHIFT
  var undoArrayOfSecondShifts = truckArray.slice(0);
  for (var i = 0; i < undoArrayOfSecondShifts.length; i++) {
    undoArrayOfSecondShifts[i] =
      calUndo +
      undoArrayOfSecondShifts[i] +
      calDateChange +
      today +
      calSecondShiftUndo;
  }
  
  var listOfUndoSecondShiftCommands = undoArrayOfSecondShifts.join("\r\n");
  
  // RESET 1ST SHIFT
  var undoArrayOfFirstShifts = truckArray.slice(0);
  for (var i = 0; i < undoArrayOfFirstShifts.length; i++) {
    undoArrayOfFirstShifts[i] =
      calUndo +
      undoArrayOfFirstShifts[i] +
      calDateChange +
      today +
      calFirstShiftUndo;
  }
  
  var listOfUndoFirstShiftCommands = undoArrayOfFirstShifts.join("\r\n");
  
  // RE-USE ON
  var arrayOfTrucksForReuseOn = truckArray.slice(0);
  for (var i = 0; i < arrayOfTrucksForReuseOn.length; i++) {
    arrayOfTrucksForReuseOn[i] =
      reuse +
      arrayOfTrucksForReuseOn[i] +
      reuseOn;
  }
  
  var listOfReuseOnCommands = arrayOfTrucksForReuseOn.join("\r\n");
  
  // RE-USE OFF
  var arrayOfTrucksForReuseOff = truckArray.slice(0);
  for (var i = 0; i < arrayOfTrucksForReuseOff.length; i++) {
    arrayOfTrucksForReuseOff[i] =
      reuse +
      arrayOfTrucksForReuseOff[i] +
      reuseOff;
  }
  
  var listOfReuseOffCommands = arrayOfTrucksForReuseOff.join("\r\n");
  
  var outputUndoArray = [
    listOfUndoRealtimeCutbackCommands,
    listOfUndoSecondShiftCommands,
    listOfUndoFirstShiftCommands,
    listOfReuseOnCommands,
    listOfReuseOffCommands
  ].join("\r\n");
  
  var filename = "Undo night shift for " + today;
  var blob = new Blob([outputUndoArray], { type: "cmd" });
  saveAs(blob, filename + ".cmd");
  document.getElementById('result').innerHTML = outputUndoArray;
});