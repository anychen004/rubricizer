//may also be known as pdfizer_proofofconcept.

//sheet & spreadsheet entity var assignments
var ssID = "1nX7pmzwWSjUHN6RAGWBRwQg4ZBSwMlLKQrWz-_PQzgY";
//if you go to the url of your spreadsheet, it's the numbers&letters after ".com/spreadsheets/d/" but before the "/edit". please copy that in and replace the existing one.

var gsheet = SpreadsheetApp.openById(ssID);
var rubric = gsheet.getSheetByName("Summary Rubric");
var gradebook = gsheet.getSheetByName("Gradebook");
//make sure that your spreadsheet tabs are named these!

var OUTPUT_FOLDER_NAME = "rubricizer_pdf_download";
//name of GFolder you'd like to save the files to. if the folder doesn't already exist, it'll make a new one for you!
var OUTPUT_PDF_NAME = "STUDENTNAME_Rubric";
//the .pdf is added automatically so don't include that. "STUDENTNAME" will be replaced by the student's name, with an underscore (FirstName_LastName).
//TODO: have "DOCTITLE" as an autofill possibility

var ran_pdfizer = false;

//vv calculating variables vv

for(var i=4;i<gradebook.getMaxColumns();i++){ //finding # of students by way of the Gradebook. index starts at 4, equiv. Column D
  //Logger.log(gradebook.getRange(2,i).getValue());
  if(gradebook.getRange(2,i).getValue() === ""){
      var NUM_STUDENTS = i-4; //HARDCODED # of rows that aren't students, then subtract 1
      Logger.log("num of students: " + NUM_STUDENTS);
      break;
    }
}

//========================================================================
//vv function defining vv
function pdf_getFolderByName_(folderName) {
  //original from https://developers.google.com/apps-script/samples/automations/generate-pdfs thank you
  //input: name of GDrive folder
  //returns: new GDrive folder
  //does: makes a new GDrive folder w/ input folder name, or if one already exists, then returns that one

  // Gets the Drive Folder of where the current spreadsheet is located.
  const ssId = SpreadsheetApp.getActiveSpreadsheet().getId();
  const parentFolder = DriveApp.getFileById(ssId).getParents().next();

  // Iterates the subfolders to check if the PDF folder already exists.
  const subFolders = parentFolder.getFolders();
  while (subFolders.hasNext()) {
    let folder = subFolders.next();

    // Returns the existing folder if found.
    if (folder.getName() === folderName) {
      return folder;
    }
  }
  // Creates a new folder if one does not already exist.
  return parentFolder.createFolder(folderName)
    .setDescription(`PDFs from Rubricizer`);
}

function pdf_getFolderByName_confirmation(folderName) {
  //original from https://developers.google.com/apps-script/samples/automations/generate-pdfs thank you
  //input: name of folder
  //output: none
  //does: a test function. prints the folder (location) the pdfs'll be saved to

  // Gets the PDF folder in Drive.
  const folder = pdf_getFolderByName_(folderName);
  Logger.log("Saved to:")
  Logger.log(`Name: ${folder.getName()}\rID: ${folder.getId()}\rDescription: ${folder.getDescription()}`)
  // To automatically delete test folder, uncomment the following code:
  // folder.setTrashed(true);
}

function createPDF(ssId, rubric, pdfName, folderName) {
  //original from https://developers.google.com/apps-script/samples/automations/generate-pdfs thank you
  //input: spreadsheet ID, rubric tab, desired name for PDF, name of folder to save PDF to
  //returns: none
  //does: creates & saves a .pdf in the folder indicated

  Logger.log("starting createPDF...");

  for(var i=1;i<rubric.getMaxRows();i++){ //TODO: find the GApps Script function that ignores unused ranges when finding size of sheet so I don't need this for-loop anymore. this is for finding lr, the row-coord of the cell you want to be the lower-right corner of the range captured in the PDF
    if(rubric.getRange(i,2).getValue() === ""){ //TODO: only calculate lr once for everyone then pass it as an input
      var lr = i-1;
      break;
    }
  }

  //^^ lr declared above ^^
  const fr = 0, fc = 1, lc = 6; //f = "first", l = "last", r = "row", c = "column" (inclusive)
  Logger.log("pdfizing range: (" + String(fr) + "," + String(fc) + ") to (" + String(lr) + "," + String(lc) + ")");

  var sheetID = rubric.getSheetId(); //gets sheetID of the rubric tab :)

  const url = "https://docs.google.com/spreadsheets/d/" + ssId + "/export" +
    "?format=pdf&" + //ik these might not be the default print settings when you CMD+P but i haven't the heart to fix them rn
    "size=7&" +
    "fzr=true&" +
    "portrait=false&" +
    "fitw=true&" +
    "gridlines=false&" +
    "printtitle=false&" +
    "top_margin=0.5&" +
    "bottom_margin=0.25&" +
    "left_margin=0.5&" +
    "right_margin=0.5&" +
    "sheetnames=false&" +
    "pagenum=UNDEFINED&" +
    "attachment=true&" +
    "gid=" + sheetID + '&' +
    "r1=" + fr + "&c1=" + fc + "&r2=" + lr + "&c2=" + lc; //lr is not declared with the others b/c it's a function input

  const params = { method: "GET", headers: { "authorization": "Bearer " + ScriptApp.getOAuthToken() } };
  const blob = UrlFetchApp.fetch(url, params).getBlob().setName(pdfName + '.pdf');

  // Gets the folder in Drive where the PDFs are stored.
  const folder = pdf_getFolderByName_(folderName);

  const pdfFile = folder.createFile(blob);
  ran_createPDF = true;
  Logger.log("completed createPDF");
}

function pdf_izer(rubric) {
  //input: rubric tab
  //returns: none, but RESULTS IN: the saving of everyone's pdfs to a GFolder indicated by the variable "OUTPUT_FOLDER_NAME"
  //does: iterates through the a1 cell in the rubric tab to create a pdf for each student
  Logger.log(ran_pdfizer);
  if(ran_pdfizer === true){ //this if-statement is copied in every use-once function b/c i'm not sure if you can cancel a function from another function. this lock thing is only needed b/c for whatever reason sometimes GApps Script runs functions twice. if you find out why lmk
  //TODO: the above function does not work lmao
    Logger.log("already run before; canceling the function!");
    return; //TODO: add manual override?
  }

  Logger.log("starting pdf_izer...");
  var studentName = "";
  pdf_getFolderByName_confirmation(OUTPUT_FOLDER_NAME);

  Logger.log(rubric.getRange(2,2).getValue())
  for(var i=2;i<NUM_STUDENTS+2;i++){
    rubric.getRange(1,1).setValue(i);
    studentName = rubric.getRange(1,2).getValue();
    Logger.log(studentName);
    createPDF(ssID, rubric, OUTPUT_PDF_NAME.replace("STUDENTNAME",studentName.replace(" ", "_")), OUTPUT_FOLDER_NAME);
  }
  Logger.log("completed pdf_izer");
  ran_pdfizer = true;
}

//========================================================================
//vv function running vv

pdf_izer(rubric);
