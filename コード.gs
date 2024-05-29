//Sheet

function getSheet(name) {
  const SPREADSHEET_ID = '1B8QMq6w4t5smDX2sv50jVo6V6aRnzkmZHbqZ8aWR6go'
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(name);

  if (!sheet) {
    throw new Error('シートが見つかりません');
  }

  return sheet;
}

function getLastData(name) {
  return getSheet(name).getDataRange().getValues().length;
}

//remo
function getNatureRemoData(endpoint) {
  const REMO_ACCESS_TOKEN = '69ALSZ18qG3vCo5gDZcrfa7Cl818TTUpeTNgygcxRlQ.Wf0jRP-f7zBAhvKOB75aqyMmdIKZVKJxr2SaEFsbYFI'
  const headers = {
    "Content-Type" : "application/json;",
    'Authorization': 'Bearer ' + REMO_ACCESS_TOKEN,
  };

  const options = {
    "method" : "get",
    "headers" : headers,
  };

  return JSON.parse(UrlFetchApp.fetch("https://api.nature.global/1/" + endpoint, options));
}

function aircon_settings(mode,temp) {
  const REMO = '69ALSZ18qG3vCo5gDZcrfa7Cl818TTUpeTNgygcxRlQ.Wf0jRP-f7zBAhvKOB75aqyMmdIKZVKJxr2SaEFsbYFI'; //REMOのアクセストークンを取得
  const AIRCON = "3ff3343b-b264-434e-82ab-badaedadb123"; //エアコンのIDを取得
  const URL = "https://api.nature.global/1/appliances/" + AIRCON + "/aircon_settings";
  const headers = {
    'Authorization': 'Bearer ' + REMO,
  };
  const payload = set_mode(mode,temp);

  if(payload == null){
    return "error";
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

function set_mode(mode,temp){
  var payload;

  if(mode == 'power-off'){
    payload ={
      "button": "power-off",
    };
  } else if(mode == 'cool'){
    payload = {
      "button": "",
      "operation_mode": "cool",
      "temperature": temp
    };
  } else if(mode == 'warm'){
    payload = {
      "button": "",
      "operation_mode": "warm",
      "temperature": temp
    };
  } else if(mode == 'dry') {
    payload = {
      "button": "",
      "operation_mode": "dry",
      /*"temperature" : "0"*/  //エアコンの機種によっては指定できない
    };
  } else {
    Logger.log('error');
    return null;
  }

  return payload;
}


//sensordata
function recordSensorData(air_set_Data) {
  const deviceData = getNatureRemoData("devices");　　　　//Remodata取得
  const lastSensorData = getLastData("sensor1");　　　　　//最終data取得

  var arg = {
    te:deviceData[0].newest_events.te.val,　　//温度
    hu:deviceData[0].newest_events.hu.val,　　//湿度
    mo:deviceData[0].newest_events.mo.created_at,　　//人感センサー
  }
  if((new Date().getMinutes()%5) == 0 && air_set_Data.rec != new Date().getMinutes()){
    setMotionData(arg, lastSensorData + 1);
    setSensorData(arg, lastSensorData + 1);
    air_set_Data.rec = new Date().getMinutes();
    setRecordTime(air_set_Data.rec);
  }
  if(motionSenser(arg, lastSensorData) == 1){
    if(air_set_Data.mode != "cool" && air_set_Data.mode != "warm"){
      let memoryMode = air_set_Data.mode;
      air_set_Data.mode = judgement(arg);
      let setTemp = getSetting();
      if(air_set_Data.mode == "cool"){
        setTemp = setTemp[0][3];
      }else if(air_set_Data.mode == "warm"){
        setTemp = setTemp[0][4];
      }
      if(air_set_Data.mode != "power-off" && air_set_Data.mode != memoryMode){
        setMotionData(arg, lastSensorData + 1);
        setSensorData(arg, lastSensorData + 1);
        setModeData(aircon_settings(air_set_Data.mode,String(setTemp)));
      }
    }
  }
  if(air_set_Data.mode != "power-off"){
    air_set_Data.mode = checkLeaveSeat(arg.mo,air_set_Data.mode);
  }
  return air_set_Data;
}

function checkLeaveSeat(lastMoTime_info,mode){
  let lastMoDate_str = lastMoTime_info.split("T")[0].split("-")
  let lastMoTime_str = lastMoTime_info.split("T")[1].split("Z")[0].split(":");
  let lastMoDate = lastMoDate_str.map(Number);
  let lastMoTime = lastMoTime_str.map(Number);
  date = new Date(lastMoDate[0],lastMoDate[1]-1,lastMoDate[2],lastMoTime[0]+9,lastMoTime[1],lastMoTime[2]);
  now = new Date();
  let differenceTime = now - date;
  if(differenceTime/1000/60 > 20){
    setModeData(aircon_settings("power-off",""));
    return "power-off";
  }
  return mode;
}


function getMotionTime(row){
  return getSheet('sensor1').getRange(row,4).getValues();
}

function motionSenser(data,row){
  let lastMoTime = getMotionTime(row);
  if(lastMoTime[0][0] != data.mo){
    return 1;
  }else{
    return 0;
  }
}

function setMotionData(data,row){
  getSheet('sensor1').getRange(row, 5).setValues([[motionSenser(data,row-1)]])
}
function setSensorData(data, row) {
  getSheet('sensor1').getRange(row, 1, 1, 4).setValues([[new Date(), data.te, data.hu, data.mo]])
}
function setModeData(data){
  getSheet('sensor1').getRange(2, 13).setValues([[data]])
}
function getSetting(){
  return getSheet('sensor1').getRange(2,6,1,5).getValues();
}

function setRecordTime(time){
  getSheet('sensor1').getRange(2,12).setValues([[time]]);
}

function judgement(data){//1:冷房　2:暖房　3:除湿
  let ary = getSetting();
  let Thigh = ary[0][0];
  let Tlow = ary[0][1];
  let Hhigh = ary[0][2];
  if(Thigh <= data.te){
    return "cool";
  }else if(Tlow >= data.te){
    return "warm";
  }else if(Hhigh <= data.hu){
    return "dry";
  }
  return "power-off";
}

function main(){
  let airconMode = getSheet('sensor1').getRange(2,13).getValues();
  let recordTime = getSheet('sensor1').getRange(2,12).getValues();
  let air_set_Data = {
    mode:airconMode[0][0],
    rec:recordTime[0][0]
  };
  air_set_Data = recordSensorData(air_set_Data);
  for(let i=0;i<2;i++){
    Utilities.sleep(18500);
    air_set_Data = recordSensorData(air_set_Data);
  }
}

