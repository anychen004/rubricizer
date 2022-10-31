function raw_cleanup(raw){
  //input: raw tab
  //returns: nothing
  //does: removes unused/unuseable columns and rows of spreadsheet
  Logger.log("starting raw_cleanup");

  //vv removes excess* columns ________________________________
  //*those that are auto-calculated by Canvas
  for(var i=1; i<raw.getMaxColumns(); i++){ //!!HARDCODED I put in the <100 to prevent an infinite loop; if we actually have more than 100 columns my b
    //Logger.log(raw.getRange(3,i).getValue());
    if (raw.getRange(3,i).getValue() === "(read only)"){ //!! HARDCODED i think we don't need anything after the "(read only)" but i could be mistaken
      var x_size = i;
      break;
    }
  }
  raw.deleteColumns(i,raw.getMaxColumns()-i+1); //!! HARDCODED number of columns after the useful ones

  //^^ removes excess columns
  //vv removes stray* rows ________________________________
  //*those not corresponding to a student
  for(var i=1; i<=raw.getMaxRows(); i++){
    //DEBUGGING Logger.log(raw.getRange(i,1).getValue())
    if(raw.getRange(i,1).getValue() === ""){
      raw.deleteRow(i);
      i--; //in order to prevent skipping now that indexes have shifted up
    }
  }
  //^^ removes stray rows
  Logger.log("completed raw_cleanup");
}
