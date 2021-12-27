function basicAutoFilling(e) {
  
  //Initialize basic variables and set column values
  var editedRow = e.range.getRow();
  var editedCol = e.range.getColumn();
  const contractorCol = 1;
  const dateEnteredCol = 2;
  const dateModifiedCol = 3;
  const clientCol = 4;
  const dateCol = 5;
  const taskCol = 6;
  const hoursCol = 7;
  const rateCol = 8;
  const detailsCol = 9;
  const totalCol = 10;
  const invoiceCol = 11;

  //----------------------------------
  //Useful functions
  //----------------------------------
  function checkAllRowCellsForValues(){
    for (let i=1; i<=9; i++){
      if (timesheet.getRange(editedRow, i).getValue() !== ''){
        return true;
      }
    }
    if (timesheet.getRange(editedRow, 4).getValue() !== ''){
      return true;
    }
    return false;
  }

  function isAlphaNumeric(str) {
    var code, i, len;

    for (i = 0, len = str.length; i < len; i++) {
      code = str.charCodeAt(i);
      if (!(code > 47 && code < 58) && // numeric (0-9)
          !(code > 64 && code < 91) && // upper alpha (A-Z)
          !(code > 96 && code < 123)) { // lower alpha (a-z)
        return false;
      }
    }
    return true;
  }

  function formatSentence(str){
    let splitSentence = str.split(' ');
    let finalSentence = '';
    for (let i=0;i<splitSentence.length;i++){
      if (splitSentence[i] === ''){
        continue;
      }
      splitSentence[i].replace(/\s+/g, '');
      splitSentence[i] += ' ';
      finalSentence += splitSentence[i];
    }

    return finalSentence;
  }

  function isEmpty(row){
    for (let i=1;i<=detailsCol;i++){
      if (timesheet.getRange(row,i).getValue() !== ''){
        return false;
      }
    }
    return true;
  }

  //------------------------------------------------------------------------------------------
  //Initial Variables
  //------------------------------------------------------------------------------------------

  if (editedRow === 1) return;
  if (SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getName() === "NO TOUCHY") {
    return;
  }
  //if (isEmpty()) return;

  var documentName = SpreadsheetApp.getActive().getName();
  //var contractorInitials = documentName.replace('timesheet', '');

  //just for this development 
  var contractorInitials = "SL";

  //Initialize Sheet Info and references
  let app = SpreadsheetApp;
  let timesheet = app.getActiveSheet();

  let noTouchySheet = app.getActive().getSheetByName("NO TOUCHY");
  let hourlyRate = noTouchySheet.getRange(2,4).getValue();

  //--------------------------------------------------------------------------------------------------------
  //Check for entered date and either auto fill entered, modified, and date or just update modified and date
  //--------------------------------------------------------------------------------------------------------
  if (timesheet.getRange(editedRow, dateEnteredCol).getValue() !== '' && checkAllRowCellsForValues()){
    timesheet.getRange(editedRow, contractorCol).setValue(contractorInitials);
    timesheet.getRange(editedRow, rateCol).setValue(hourlyRate);
    timesheet.getRange(editedRow, dateModifiedCol).setValue(new Date());
    //timesheet.getRange(editedRow, dateCol).setValue(new Date());
  }
  else if (timesheet.getRange(editedRow, dateEnteredCol).getValue() === '' && checkAllRowCellsForValues()) {
    timesheet.getRange(editedRow, contractorCol).setValue(contractorInitials);
    timesheet.getRange(editedRow, dateEnteredCol).setValue(new Date());
    timesheet.getRange(editedRow, dateModifiedCol).setValue(new Date());
    timesheet.getRange(editedRow, dateCol).setValue(new Date());
    timesheet.getRange(editedRow, rateCol).setValue(hourlyRate);
    //timesheet.getRange(editedRow, invoiceCol).setValue(invoiceNum);
  }

  //----------------------------------
  //format value and calculate total line invoice value  
  //----------------------------------
  let additionalHours = 0;
  let additionalHoursModifier = .25;
  let emailCounts = 0;
  if (Number(timesheet.getRange(editedRow, hoursCol).getValue()) >= 20){
    let alertMessage = `Did you really work ${timesheet.getRange(editedRow, hoursCol).getValue()} hours on this task?`;
    var result = app.getUi().alert(alertMessage, app.getUi().ButtonSet.YES_NO);
    if (result == app.getUi().Button.NO){
      timesheet.getRange(editedRow, hoursCol).setValue('');
    }
    else {
      app.getUi().alert("Either that was a really large and arduous task, in which case Congratulations! Or you should be more efficient");
    }
  }
  if (timesheet.getRange(editedRow,hoursCol).getValue() !== ''){
    let hours = timesheet.getRange(editedRow,hoursCol).getValue();
    if (hours.toString().includes(' ')){
      hours.toString().replaceAll(' ', '');
    }
    if (hours.toString().includes('i')){
      let iCount = 0;

      //Count and remove i's
      for(let i=0;i<hours.length;i++){
        if (hours[i] === 'i'){
          additionalHours += additionalHoursModifier;
          emailCounts++;
          hours = hours.replace('i', '');
          i--;
          if(emailCounts % 3 === 0){
            additionalHoursModifier += .25;
          }
        }
      }

      hours = hours.trim();

      //Update total cost
      //timesheet.getRange(editedRow, totalCol).setValue((parseFloat(hours) + parseFloat(additionalHours)) * hourlyRate);

      for (let i=0;i<emailCounts;i++){
        hours += 'i';
        iCount++;
        if (iCount === 3){
          hours += ' ';
          iCount = 0;
        }
      }

      //update hours value with formatted string
      hours = hours.trim();
      timesheet.getRange(editedRow,hoursCol).setValue(hours).setHorizontalAlignment('center');
    }
    else {
      //timesheet.getRange(editedRow, totalCol).setValue(parseFloat(hours) * hourlyRate);
    }
  }
  else {
    timesheet.getRange(editedRow, totalCol).clearContent();
  }

  //--------------------------------
  //Format details cell if necessary
  //--------------------------------
  if (timesheet.getRange(editedRow, detailsCol).getValue() != ''){
    let details = timesheet.getRange(editedRow, detailsCol).getValue();

    details = details.trim();

    //Do this if there's one or more line breaks
    if (details.includes('\n')){

      let finalDetails = '';
      const detailsSplit = details.split('\n');

      for (let i=0;i<detailsSplit.length;i++){

        if (detailsSplit[i] === '') continue;

        let tempDetails = detailsSplit[i];

        if (!isAlphaNumeric(tempDetails[0])){
          while (!isAlphaNumeric(tempDetails[0])){
            tempDetails = tempDetails.replace(tempDetails[0], '');
          }
        }
        if (tempDetails[0] != '-' && tempDetails[1] != ' '){
          tempDetails = tempDetails.charAt(0).toUpperCase() + tempDetails.slice(1);
          tempDetails = "- " + tempDetails;
        }
        else if (tempDetails[0] != '-' && tempDetails[1] === ' '){
          tempDetails = tempDetails.charAt(0).toUpperCase() + ' ' + tempDetails.slice(2);
          tempDetails = "- " + tempDetails;
        }
        else if (tempDetails[0] == '-' && tempDetails[1] != ' '){
          tempDetails = '- ' + tempDetails.split('-')[1].trim(); 
        }

        if (i > 0){
          tempDetails = '\n' + tempDetails;
        }

        finalDetails += formatSentence(tempDetails);
      }

      timesheet.getRange(editedRow, detailsCol).setValue(finalDetails);
    }
    else {
      
      //Remove non-alphanumeric chars and whitespace
      if (!isAlphaNumeric(details[0])){
        while (!isAlphaNumeric(details[0])){
          details = details.replace(details[0], '');
        }
      }
      if (details[0] != '-' && details[1] != ' '){
        details = details.charAt(0).toUpperCase() + details.slice(1);
        details = "- " + details;
      }
      else if (details[0] != '-' && details[1] === ' '){
        details = details.charAt(0).toUpperCase() + ' ' + details.slice(2);
        details = "- " + details;
      }
      else if (details[0] == '-' && details[1] != ' '){
        details = '- ' + details.split('-')[1].trim(); 
      }
      timesheet.getRange(editedRow, detailsCol).setValue(formatSentence(details));
    }
  }

  //---------------------------------------------------------------------
  //Check cell values and give red background to anything without a value
  //---------------------------------------------------------------------

  if (!isEmpty(editedRow-1)){
    for (let i=1;i<=detailsCol;i++){
      if (timesheet.getRange(editedRow-1, i).getValue() === ''){
        timesheet.getRange(editedRow-1,i).setBackground('red');
      }
    }
  }
  if (!isEmpty(editedRow)){
    for (let i=1;i<=detailsCol;i++){
      if (timesheet.getRange(editedRow,i).getValue() != ''){
        timesheet.getRange(editedRow,i).setBackground('white');
      }
    }
  }
  else {
    for (let i=1;i<=detailsCol;i++){
      timesheet.getRange(editedRow,i).setBackground('white');
    }
  }
}
