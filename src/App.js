import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import * as SpotifyWebApi from './spotify-web-api';
import Autocomplete from 'react-autocomplete';

// React-Bootstrap Imports
import Button from 'react-bootstrap/lib/Button';
import Modal from 'react-bootstrap/lib/Modal';
import Table from 'react-bootstrap/lib/Table';
import Media from 'react-bootstrap/lib/Media';
import Jumbotron from 'react-bootstrap/lib/Jumbotron';


// Link compontent
// import Link from "./Link";

//History.js
import createHashHistory from 'history/createHashHistory'
const history = createHashHistory({ hashType: 'noslash' });

// https://stackoverflow.com/questions/21294302/converting-milliseconds-to-minutes-and-seconds-with-javascript
function convertTime(milliseconds) {
  var minutes = Math.floor(milliseconds / 60000);
  var seconds = ((milliseconds % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

const SongsTable = ({ songs }) => (
  <Table striped bordered condensed hover>
    <thead>
      <tr>
        <th>Song Name</th>
        <th>Song Length</th>
      </tr>
    </thead>
    <tbody>
      {songs.map(
        (song) => (
          <tr>
            <th>{song.name}</th>
            <th>{convertTime(song.duration_ms)}</th>
          </tr>
        )
      )}
    </tbody>
  </Table>
);

const LoadingMessage = () => (
  <div><img src={logo} className="App-logo" alt="logo" /></div>
);

function artistNames(artists) {
  var array = []
  artists.forEach((artist) => {
    array.push(artist.name)
  })
  if (array.length > 1) {
    array[array.length - 1] = "and " + array[array.length - 1]
  }
  if (array.length > 2) {
    return array.join(", ")
  } else {
    return array.join(" ")
  }
}

const AlbumHeader = ({ album }) => (
  <Media>
    <Media.Left align="top">
      <img width={64} height={64} src={album.images[2].url} alt="album thumbnail" />
    </Media.Left>
    <Media.Body>
      <Media.Heading>By {artistNames(album.artists)}</Media.Heading>
      <p>This was released in {album.release_date}.</p>
    </Media.Body>
  </Media>
)


class ArtistDisplay extends Component {
  constructor() {
    super();
    this.state = { albums: [], selectedAlbum: null, loading: false, artistId: null }
  }

  getAlbums(artistId) {
    if (artistId == "") {
      this.saveAlbums([])
    } else {
      this.props.spotifyApi.getArtistAlbums(artistId)
        .then(data => {
          return data.items
        })
        .then(albumArray => this.saveAlbums(albumArray))
        .catch(error => {
          console.log(error)
        })
    }
  }

  saveAlbums(albumArray) {
    this.setState({albums: albumArray, loading: false})
    this.updateHistory();
  }

  componentDidMount() {
    if (this.props.artistId !== null) {
      this.checkForUpdates(this.props.artistId);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.artistId != null) {
      this.checkForUpdates(nextProps.artistId);
    }
  }

  checkForUpdates(currentArtistId) {
    if (currentArtistId !== this.state.artistId) {
      this.setState({ loading: true })
      this.getAlbums(currentArtistId);
      this.setState({ artistId: currentArtistId });
    }
  }

  albumsDisplay(array) {
    if (this.state.loading == true) {
      return (<LoadingMessage />)
    }
    else if (array.length == 0) {
      return (<span>No Results.</span>)
    } else {
      return (<ul>
          {array.map(
            (element) => (
            <li key={element.id}>
              <Album
                album={element}
                spotifyApi={this.props.spotifyApi} />
            </li>)
          )}
        </ul>)
    }
  }

  returnToSearch() {
    history.push("/")
  }

  render() {
    return (<div>
        <Button
         bsStyle="primary"
         bsSize="small"
         onClick={this.returnToSearch}>
         Back To Search
       </Button>
        <h3>{ this.props.artistName ? this.props.artistName + "'s Albums": "Albums"}</h3>
      { this.albumsDisplay(this.state.albums) }
      </div>)
  }
}

class Album extends Component {
  constructor() {
    super();
    this.state = { showModal: false, album: null };
  }

  close = () =>  {
    this.setState({ showModal: false });
  }

  open = () => {
    this.setState({ showModal: true });
  }

  saveAlbum(album) {
    this.setState({album: album});
  }

  acquireAlbumInfo(albumId) {
    if (albumId == "") {
      console.log("No albumId provided");
    } else {
      this.props.spotifyApi.getAlbum(albumId)
        .then(album => {
          return album;
        })
        .then(album => this.saveAlbum(album))
        .catch(error => {
          console.log(error)
        })
    };
  }

  componentDidMount() {
    this.acquireAlbumInfo(this.props.album.id)
  }

  displayGeneratedText() {
    return (<div>
        <AlbumHeader album={this.state.album} />
        <SongsTable songs={this.state.album.tracks.items} />
      </div>)
  }

  render() {
    return (<div>
      <Button
         bsStyle="primary"
         bsSize="large"
         onClick={this.open}>
         { this.props.album.name }
       </Button>
        <Modal show={this.state.showModal} onHide={this.close} bsSize="large">
          <Modal.Header closeButton>
              <Modal.Title>{ this.props.album.name }</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {this.state.album == null ? <LoadingMessage /> : this.displayGeneratedText() }
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.close}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>)
  }
}

const apiUrl = process.env.NODE_ENV === 'production' ? "https://tra38.github.io/SpotifyAlbums/#/callback" : "http://localhost:3000/#/callback";

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
      <Jumbotron>
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
    return (<ArtistDisplay artistId={artistId} artistName={artistName} spotifyApi={this.state.spotifyApi}/>)
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
