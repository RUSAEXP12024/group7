function aircon_settings(mode) {
  const REMO = PropertiesService.getScriptProperties().getProperty('REMO_ACCESS_TOKEN'); //REMOのアクセストークンを取得
  const AIRCON = PropertiesService.getScriptProperties().getProperty('AIRCON_ID'); //エアコンのIDを取得
  const URL = "https://api.nature.global/1/appliances/" + AIRCON + "/aircon_settings";
  const headers = {
    'Authorization': 'Bearer ' + REMO,
  };
  const payload = set_mode(mode);

  if(payload == null){
    return;
  }

  const options = {
    "method": "post",
    "headers": headers,
    "payload": payload
  };

  const reply = JSON.parse(UrlFetchApp.fetch(URL,options));

  if(reply.button == 'power-off'){
    return reply.button;
  }
  return reply.mode;
}

function set_mode(mode){
  var payload;

  if(mode == '0'){
    payload ={
      "button": "power-off",
    };
  } else if(mode == '1'){
    payload = {
      "button": "",
      "operation_mode": "cool",
      "temperature": "18"
    };
  } else if(mode == '2'){
    payload = {
      "button": "",
      "operation_mode": "warm",
      "temperature": "23"
    };
  } else if(mode == '3') {
    payload = {
      "button": "",
      "operation_mode": "dry",
      "temperature" : "0"
    };
  } else {
    Logger.log('error');
    return null;
  }

  return payload;
}

