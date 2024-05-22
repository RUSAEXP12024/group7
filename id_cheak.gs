function id_get(REMO) {
  const BASE_URL = "https://api.nature.global/1/"
  const url = BASE_URL + "appliances"  
  const headers = {
    'Authorization' : 'Bearer ' + REMO
    }
  const options = {
    "method" : "get",
    "headers" : headers
  };
  const reply = JSON.parse(UrlFetchApp.fetch(url, options));
  return reply;
}
