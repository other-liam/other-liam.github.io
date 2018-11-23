$('.message a').click(function(){
   $('form').animate({height: "toggle", opacity: "toggle"}, "slow");
});

//LIST OF VARIABLES I'LL NEED

//CLIPBOARD.JS REQUIREMENT
//new ClipboardJS('.btn');

//CUT BACK REALTIME SHIFT TO 2:00 - 17:00, ADD PRMT3 PROPERTY
var rtShiftCommand = 'realtimeShiftCommand -r"';
var rtRegion = '" -d"AUSQLD ';
var rtCutbackAndPermit = '" -R"AUSQLD 2:00 -AUSQLD 17:00" -!"PRMT3"';

//CUT BACK SHIFT 1 TO 2:00 - 17:00
var calChange = 'resCalendar  -a"AddItem" -r"';
var calDateChange = '" -d"';
var calShiftOneChange = '" -s"AUSQLD,';
var shiftOneStartTime = '';
var shiftOneEndTime = '';
var endAdjustment = '" -u"0"'

//CREATE SHIFT 2 AS 17:00 - 20:00, ADD PRMT3 + NIGHT PROPERTIES
var calShiftTwoChange = '" -n"2" -s"AUSQLD,';
var shiftTwoStartTime = '';
var shiftTwoEndTime = '';
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

//SET UP FOR DATE MAGIC

var today = new Date();
var dd = today.getDate();
var mm = today.getMonth() + 1;
var yyyy = today.getFullYear();

if (dd < 10) { // if the date is any single digit
  dd = "0" + dd; // add a leading 0, so the day is always 2 digits long.
}

if (mm < 10) { // if the month is any single digit
  mm = "0" + mm; // add a leading 0, so the day is always 2 digits long.
}

today = dd + "." + mm + "." + yyyy;

function getDayName(dateStr, locale)
{
    var date = new Date(dateStr);
    return date.toLocaleDateString(locale, { weekday: 'long' });        
}

var dateStr = Date();
var day = getDayName(dateStr);

var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var d = new Date(dateStr);
var dayName = days[d.getDay()];

//END DATE MAGIC

//SET UP FOR START TIME CALCULATION MAGIC
if (dayName == 'Monday') {
  var shiftOneStartTime = "93600";
  var shiftOneEndTime = "147600";
  var shiftTwoStartTime = "147600";
  var shiftTwoEndTime = "158400";
} else if (dayName == 'Tuesday') {
  var shiftOneStartTime = "180000";
  var shiftOneEndTime = "234000";
  var shiftTwoStartTime = "234000";
  var shiftTwoEndTime = "244800";
} else if (dayName == 'Wednesday') {
  var shiftOneStartTime = "266400";
  var shiftOneEndTime = "320400";
  var shiftTwoStartTime = "320400";
  var shiftTwoEndTime = "331200";
} else if (dayName == 'Thursday') {
  var shiftOneStartTime = "352800";
  var shiftOneEndTime = "406800";
  var shiftTwoStartTime = "406800";
  var shiftTwoEndTime = "417600";
} else if (dayName == 'Friday') {
  var shiftOneStartTime = "439200";
  var shiftOneEndTime = "493200";
  var shiftTwoStartTime = "493200";
  var shiftTwoEndTime = "504000";
} else {
  console.log("NOT A NIGHTSHIFT-COMPATIBLE DAY");
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
      shiftOneStartTime +
      ',' +
      shiftOneEndTime +
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
      shiftTwoStartTime +
      ',' +
      shiftTwoEndTime +
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
  //document.getElementById('result').innerHTML = outputArray;
  
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
