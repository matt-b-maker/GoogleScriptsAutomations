const acroColumn = 1;
const idColumn = 3;
const worksheetColumn = 4;
const billLabel = "AdminYP/op:Gmail/bill";


function myFunction() {
  let start = new Date();
  let labelObject = GmailApp.getUserLabelByName(billLabel);
  let threads = labelObject.getThreads();

  class email {
    constructor(acronym, date, sender, details, thread){
      this.acronym = acronym;
      this.date = date;
      this.sender = sender;
      this.details = details;
      this.thread = thread;
    }
  }

  var emails = [];

  threads.forEach((thread) => {
    thread.getLabels().forEach((label) => {
      if (label.getName().includes("Clients/Active Clients/")) {
        emails.push(new email(label.getName().split('/')[2], 
        thread.getMessages()[thread.getMessageCount()-1].getDate().toLocaleString("en-US").split(',')[0],
        getSender(thread),
        thread.getMessages()[thread.getMessageCount()-1].getSubject(),
        thread
        ));
      }
    });
  });

  var fieldOptionsSheet = SpreadsheetApp.getActive().getSheetByName("Field Options");

  let acronyms = getClientAcronyms(fieldOptionsSheet);

  for (let i=0;i<emails.length;i++) {
    let rowToMod = 0;
    for (let acro of acronyms) {
      if (acro === emails[i].acronym){
        var eAcroSpreadsheetId = fieldOptionsSheet.getRange(acronyms.indexOf(acro) + 2, idColumn).getValue();

        if (eAcroSpreadsheetId === ''){
          Logger.log(`${acro} didn't have a spreadsheet id in the field options sheet`);
          continue;
        }

        var ssToMod = '';
        if (SpreadsheetApp.openById(eAcroSpreadsheetId.toString()).getSheetByName("OPEN") !== null){
          ssToMod = SpreadsheetApp.openById(eAcroSpreadsheetId.toString()).getSheetByName("OPEN");
        }
        else {
          ssToMod = SpreadsheetApp.openById(eAcroSpreadsheetId.toString()).getSheetByName("Correspondence");
        }        
        if (ssToMod === null){
          console.log(acro);
          break;
        }
        const senderCol = 1;
        const dateCol = 2;
        const taskCol = 3;
        const tallyCol = 4;
        const rateCol = 5;
        const detailsCol = 6;

        let count = 2;
        while (ssToMod.getRange(count, tallyCol).getValue() !== ''){
          count++;
        }
        rowToMod = count;
        Logger.log(emails[i].acronym + "\n" + rowToMod + "\n" + emails[i].date + "\n" + emails[i].sender + "\n" + emails[i].details);
        //ssToMod.getRange(rowToMod,senderCol).setValue(emails[i].sender);
        //ssToMod.getRange(rowToMod,dateCol).setValue(emails[i].date);
        //ssToMod.getRange(rowToMod,taskCol).setValue("Correspondence");
        //ssToMod.getRange(rowToMod,tallyCol).setValue('i');
        //ssToMod.getRange(rowToMod,rateCol).setValue(getRate(acro));
        //ssToMod.getRange(rowToMod,detailsCol).setValue(emails[i].details);
        var currentThread = emails[i].thread;
        Logger.log(currentThread);
        var currentEmailLabels = currentThread.getLabels();
        currentEmailLabels.forEach((label) => {
          if (label.getName() === billLabel){
            currentThread.removeLabel(label);
          }
        });
        break;
      }
    }
  }
}

function getClientAcronyms(fieldOptions){
  let count = 2;
  let acronyms = [];
  do {
    acronyms.push(fieldOptions.getRange(count, acroColumn).getValue());
    count++;
  } while (fieldOptions.getRange(count,acroColumn).getValue() !== "");

  return acronyms;
}

function getSender(thread) {
  if (thread.getMessages()[thread.getMessageCount()-1].getFrom().includes('<')) {
    return thread.getMessages()[thread.getMessageCount()-1].getFrom().split('<')[1].slice(0, -1);
  }
  else {
    return thread.getMessages()[thread.getMessageCount()-1].getFrom();
  }
}

function getRate(acro) {
  return "40.00";
}
