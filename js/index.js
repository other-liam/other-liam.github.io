$('.message a').click(function(){
   $('form').animate({height: "toggle", opacity: "toggle"}, "slow");
});

//SHIFT TIMES
var shiftOneStartTime = 200; //can't use 0200 because JS hates leading 0s
var shiftOneEndTime = 1700;
var shiftTwoStartTime = 1700;
var shiftTwoEndTime = 2000;
var numberOfSecondsInDay = 60 * 60 * 24; //Tesys sets 12 AM Sunday as reference point

//TESYS COMMANDS
//CUT BACK REALTIME SHIFT TO 2:00 - 17:00, ADD PRMT3 PROPERTY
var rtShiftCommand = 'realtimeShiftCommand -r"';
var rtRegion = '" -d"AUSQLD ';
var rtCutbackAndPermit = '" -R"AUSQLD 2:00 -AUSQLD 17:00" -!"PRMT3"';

//CUT BACK SHIFT 1 TO 2:00 - 17:00
var calChange = 'resCalendar  -a"AddItem" -r"';
var calDateChange = '" -d"';
var calShiftOneChange = '" -s"AUSQLD,';
var endAdjustment = '" -u"0"'

//CREATE SHIFT 2 AS 17:00 - 20:00, ADD PRMT3 + NIGHT PROPERTIES
var calShiftTwoChange = '" -n"2" -s"AUSQLD,';
var calPermits = '" -u"0" -c"NIGHT SHIFT" -H"1" -!"NIGHT,PRMT3"';

//RE-USE ON
var reuse = 'vc -v"';
var reuseOn = '" -^"1"';

//RE-USE OFF
var reuseOff = '" -^"0"';

//UNDO
var rtUndo = '" -x"1" -!""'
var calUndo = 'resCalendar  -a"UpdateItem" -r"'
var calSecondShiftUndo = '" -n"2" -s"unset" -c"unset" -H"unset" -!"unset"'
var calFirstShiftUndo = '" -n"1" -s"unset"'

//DATE MAGIC
var today = new Date();
var dayNumber = today.getDay();
var dd = today.getDate();
var mm = today.getMonth() + 1;
var yyyy = today.getFullYear();

if (dd < 10) { // if the date is any single digit
  dd = "0" + dd; // add a leading 0, so the day is always 2 digits long.
}

if (mm < 10) {
  mm = "0" + mm;
}

today = dd + "." + mm + "." + yyyy;
//END DATE MAGIC

//START TIME CALCULATION MAGIC
//Input a shift number, either 1 or 2, and return a two-item array of shift times.
function calculateShiftTime(shiftNumber){
  if (shiftNumber == 1) {
    var timeArray = [(shiftOneStartTime * 36) + (numberOfSecondsInDay * dayNumber),
                     (shiftOneEndTime * 36) + (numberOfSecondsInDay * dayNumber)]
  }
  else if (shiftNumber == 2) {
    var timeArray = [(shiftTwoStartTime * 36) + (numberOfSecondsInDay * dayNumber),
                     (shiftTwoEndTime * 36) + (numberOfSecondsInDay * dayNumber)]
  }
  else console.log("Invalid shift number!")
  return timeArray
}
//END START TIME CALCULATION MAGIC

//SAVE PRMT3 FILE BUTTON
$("#btn-save").click(function() {

  var unformattedTruckList = $("#input-truckList").val();
  var truckArray = unformattedTruckList.split(" ");
  for(var i=0;i<truckArray.length;i++){
    truckArray[i]="PCA"+truckArray[i];
  }
  
  //CUT BACK REALTIME SHIFT
  var arrayOfTrucksForRealtime = truckArray.slice(0);
  for (var i = 0; i < arrayOfTrucksForRealtime.length; i++) {
    arrayOfTrucksForRealtime[i] =
      rtShiftCommand +
      arrayOfTrucksForRealtime[i] +
      rtRegion +
      today +
      rtCutbackAndPermit;
  }
  
  var listOfRealtimeCutbackCommands = arrayOfTrucksForRealtime.join("\r\n");
  
  //CUT BACK SHIFT 1
  var arrayOfTrucksForShiftOne = truckArray.slice(0);
  for (var i = 0; i < arrayOfTrucksForShiftOne.length; i++) {
    arrayOfTrucksForShiftOne[i] =
      calChange +
      arrayOfTrucksForShiftOne[i] +
      calDateChange +
      today +
      calShiftOneChange +
      calculateShiftTime(1) +
      endAdjustment;
  }
  
  var listOfShiftOneChangeCommands = arrayOfTrucksForShiftOne.join("\r\n");
  
  //CREATE SHIFT 2
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
  
  //RE-USE ON
  var arrayOfTrucksForReuseOn = truckArray.slice(0);
  for (var i = 0; i < arrayOfTrucksForReuseOn.length; i++) {
    arrayOfTrucksForReuseOn[i] =
      reuse +
      arrayOfTrucksForReuseOn[i] +
      reuseOn;
  }
  
  var listOfReuseOnCommands = arrayOfTrucksForReuseOn.join("\r\n");
  
  //RE-USE OFF
  var arrayOfTrucksForReuseOff = truckArray.slice(0);
  for (var i = 0; i < arrayOfTrucksForReuseOff.length; i++) {
    arrayOfTrucksForReuseOff[i] =
      reuse +
      arrayOfTrucksForReuseOff[i] +
      reuseOff;
  }
  
  var listOfReuseOffCommands = arrayOfTrucksForReuseOff.join("\r\n");
  
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
  
  //OUTPUT SECTION
  document.getElementById('result').innerHTML = outputArray;});

$("#btn-undo").click(function() {
  
  var unformattedTruckList = $("#input-truckList").val();
  var truckArray = unformattedTruckList.split(" ");
  for(var i=0;i<truckArray.length;i++){
    truckArray[i]="PCA"+truckArray[i];
  }
  
  //UNDO CUT BACK REALTIME SHIFT
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
  
  //CLEAR 2ND SHIFT
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
  
  //RESEST 1ST SHIFT
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
  
  //RE-USE ON
  var arrayOfTrucksForReuseOn = truckArray.slice(0);
  for (var i = 0; i < arrayOfTrucksForReuseOn.length; i++) {
    arrayOfTrucksForReuseOn[i] =
      reuse +
      arrayOfTrucksForReuseOn[i] +
      reuseOn;
  }
  
  var listOfReuseOnCommands = arrayOfTrucksForReuseOn.join("\r\n");
  
  //RE-USE OFF
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