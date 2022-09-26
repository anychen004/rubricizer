function raw_cleanup(raw){
  //input: raw tab
  //returns: nothing
  //does: removes unused/unuseable columns and rows of spreadsheet
  Logger.log("running raw_cleanup");

  //vv removes excess* columns ________________________________
  //*those that are auto-calculated by Canvas
  for(var i=1; i<raw.getMaxColumns(); i++){ //!!HARDCODED I put in the <100 to prevent an infinite loop; if we actually have more than 100 rows my b
    //Logger.log(raw.getRange(3,i).getValue());
    if (raw.getRange(3,i).getValue() === "(read only)"){ //!! HARDCODED i think we don't need anything after the "(read only)" but i could be mistaken
      var x_size = i;
      break;
    }
  }
  raw.deleteColumns(i,raw.getMaxColumns()-i+1); //!! HARDCODED number of columns after the useful ones
  Logger.log("excess columns removed")
  //^^ removes excess columns
  //vv removes stray* rows ________________________________
  //*those not corresponding to a student
  for(var i=1; i<=raw.getMaxRows(); i++){
    Logger.log(raw.getRange(i,1).getValue())
    if(raw.getRange(i,1).getValue() === ""){
      raw.deleteRow(i);
      i--; //in order to prevent skipping now that indexes have shifted up
    }
  }
  //^^ removes stray rows
}

function re_name_index() {
  //input: raw canvas export, gradebook, person being Considered
  //returns: none, but RESULTS IN: the student name row in the gradebook filled in
  //does: gets the index of the person being Considered and puts their name into the gradebook
}

function re_locate_grade_cell() {
  //input: raw canvas export, person being Considered
  //returns: location in gradebook
  //does: based on the assignment's Rubric Points Considered, and the person being Considered, it will find the cell in the gradebook that the grade should be put in
}

function re_tally_and_threshold_grade() {
  //input: raw canvas export, person being Considered
  //returns: none, but RESULTS IN: number in gradebook
  //does: tally-thresholds the grade and inserts it into the gradebook
}

//============================

function pdf_load() {
  //input: gradebook, person index
  //returns:
  //does: puts the person index into the box so the rubric (first tab) autofills
}

function pdf_save() {
  //input:
  //returns:
  //does:
}

//^^ sub functions ^^
//============================================================================================
//vv main functions vv

function reformatter() {
  //input: raw canvas export, gradebook
  //returns: none, but RESULTS IN: a properly reformatted gradebook
  //does: runs all of the reformatting functions (those starting with "re") in a loop
}

function pdf_izer() {
  //input: gradebook
  //returns: none, but RESULTS IN: the downloading of everyone's pdfs
  //does: runs all of the pdf-izer functions (those starting with "pdf") in a loop
}

//^^ main functions ^^
//============================================================================================
//vv test functions vv

function tests_setup() {
//idk
}

function tests_run() {
  //idk
}

function tests_cleanup() {
  //idk
}

//^^ test functions ^^
//============================================================================================
//vv run functions vv

//sheet entity var assignments
var gsheet = SpreadsheetApp.openById("1nX7pmzwWSjUHN6RAGWBRwQg4ZBSwMlLKQrWz-_PQzgY"); //TODO: figure out how to get this customizable
var raw = gsheet.getSheetByName("raw"); //!! HARDCODED name of Canvas export tab; will need to manually rename
var gradebook = gsheet.getSheetByName("Gradebook"); //HARDCODED name of Gradebook tab; ought to be already done
//var reference = gsheet.getSheetName("reference"); //!! HARDCODED name of reference tab; will  need to make manually

raw_cleanup(raw);

function ref_setup(raw,reference){
  for(i=0;i<10;i++){

  }
}
