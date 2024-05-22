function script_write() {
  const REMO = PropertiesService.getScriptProperties().getProperty('REMO_ACCESS_TOKEN');
  const appliances = id_get(REMO);
  var i = 0;
  var TYPE;
  var AIRCON;
  Logger.log(appliances);
  while(1){
    TYPE = appliances[i].type;

    if(TYPE == null){
      Logger.log('error');
      return;
    }

    if(TYPE == 'AC'){
      AIRCON =appliances[i].id;
      break;
    }
    i++;
  }

  //PropertiesService.getScriptProperties().setProperty('REMO_ACCESS_TOKEN', REMO);
  //PropertiesService.getScriptProperties().setProperty('AIRCON_ID', AIRCON);

}
