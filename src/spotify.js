import * as SpotifyWebApi from './spotify-web-api';

var spotifyApi = new SpotifyWebApi();

var clientId = "31a3a0db952a408995ab245276c1704a"
var callbackUri = encodeURIComponent("http://localhost:3000")

//https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function getParameterByName(name) {
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[#?&]" + name + "(=([^&#]*)|&|#|$)")

  var results = regex.exec(window.location.hash)
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

var access_token = getParameterByName("access_token")

if (access_token != null) {
  spotifyApi.setAccessToken(access_token);

  spotifyApi.searchArtists('Love')
    .then(function(data) {
      console.log('Search artists by "Love"', data);
    }, function(err) {
      console.error(err);
    });
} else {
  window.location.href = "https://accounts.spotify.com/authorize?client_id=" + clientId + "&redirect_uri=" + callbackUri + "&response_type=token"
}


// if ()
// window.location.href = "https://accounts.spotify.com/authorize?client_id=" + clientId + "&redirect_uri=" + callbackUri + "&response_type=token"


// spotifyApi.setAccessToken("31a3a0db952a408995ab245276c1704a");

// spotifyApi.searchArtists('Love')
//   .then(function(data) {
//     console.log('Search artists by "Love"', data);
//   }, function(err) {
//     console.error(err);
//   });

// console.log("31a3a0db952a408995ab245276c1704a")