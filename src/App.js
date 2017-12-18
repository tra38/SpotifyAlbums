import React, { Component } from 'react';
import './App.css';
import * as SpotifyWebApi from './spotify-web-api';
import Autocomplete from 'react-autocomplete';

// React-Bootstrap Imports
import Button from 'react-bootstrap/lib/Button';
import Jumbotron from 'react-bootstrap/lib/Jumbotron';

// Other dependencies
import LoadingMessage from './LoadingMessage';
import ArtistDisplay from './ArtistDisplay';
import { history, apiUrl }  from './defaults';

class App extends Component {
  constructor() {
    super();
    this.state = { accessToken: null, spotifyApi: new SpotifyWebApi(), clientId: "31a3a0db952a408995ab245276c1704a", callbackUri: encodeURIComponent(apiUrl), value: "", artists: [], selectedArtist: null, location: history.location };

    history.listen(this.handleNavigation)
  }

  requestTimer = null

  componentDidMount() {
    this.queryAccessToken();
  }

  acquireAccessToken() {
    window.location.href = "https://accounts.spotify.com/authorize?client_id=" + this.state.clientId + "&redirect_uri=" + this.state.callbackUri + "&response_type=token"
  }

  queryAccessToken() {
    var access_token = this.getParameterByName("access_token")

    if (access_token != null) {
      this.state.spotifyApi.setAccessToken(access_token);
    } else {
      this.acquireAccessToken();
    }
  }

  saveArtists(artistArray) {
    this.setState({ artists: artistArray })
  }

  handleNavigation = (location) => {
    this.setState({ location: location })
  }

  getArtists(name) {
    if (name == "") {
      return []
    } else {
      this.state.spotifyApi.searchArtists(name)
        .then(data => {
          return data.artists.items
        })
        .then(artistArray => this.saveArtists(artistArray))
        .catch(error => {
          if (error.statusText == "Unauthorized") {
            this.acquireAccessToken();
          } else {
            console.log(error)
          }
        })
    }
  }

  findArtist(name) {
    return this.state.artists.filter(x => x.name === name )[0]
  }

  getParameterByName(name) {
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp(name + "(=([^&#]*)|&|#|$)")
    var results = regex.exec(window.location.hash)
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  searchButtonGenerator() {
    return (
      <Jumbotron className="center">
        <h2>Find Your Favorite Albums!</h2>
        <h4>Type in the name of your favorite artist and then select his/her name. You will see a list of albums associated with that artist.</h4>
        <Autocomplete
          getItemValue={(item) => item.name}
          items={this.state.artists}
          renderItem={(item, isHighlighted) =>
            <div style={{ background: isHighlighted ? 'lightgray' : 'white' }} key={item.id}>
              {item.name}
            </div>
          }
          value={this.state.value}
          onChange={(e) => {
            this.setState({value: e.target.value})
            clearTimeout(this.requestTimer)
            this.requestTimer = this.getArtists(this.state.value)
          }}
          onSelect={(selectedInput) => {
            var selectedArtist = this.findArtist(selectedInput)
            this.setState({ value: selectedInput, selectedArtist: selectedArtist })
            history.push("/artist?artistId=" + selectedArtist.id + "&artistName=" + encodeURIComponent(selectedArtist.name))
          }} />
      </Jumbotron>)
  }

  artistDisplayGenerator(artistId, artistName) {
    return (<ArtistDisplay
              artistId={artistId}
              artistName={artistName}
              spotifyApi={this.state.spotifyApi}
              queryAccessToken={this.queryAccessToken} />)
  }

  currentPath(string) {
    const pathName = this.state.location.pathname
    const stringLength = string.length
    return (string === pathName.substring(0, stringLength))
  }

  render() {
    if (this.currentPath("/accessToken")) {
      this.queryAccessToken();
      return (<div>
          { this.searchButtonGenerator() }
          </div>)
    }
    else if (this.currentPath("/artist")) {
      const artistId = this.getParameterByName("artistId")
      const artistName = this.getParameterByName("artistName")
      if (artistId != null) {
        return (<div>
            { this.artistDisplayGenerator(artistId, artistName) }
            </div>)
      } else {
        return (
          <div>
          { this.searchButtonGenerator() }
          </div>
          )
      }
    }
    else {
      return (
          <div>
          { this.searchButtonGenerator() }
          </div>
          )
    }
  }
}

export default App;
