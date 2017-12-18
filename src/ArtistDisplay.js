import React, { Component } from 'react';

// React-Bootstrap Imports
import Button from 'react-bootstrap/lib/Button';
import Col from 'react-bootstrap/lib/Col';
import Grid from 'react-bootstrap/lib/Grid';
import Row from 'react-bootstrap/lib/Row';

//Other dependencies
import Album from './Album';
import LoadingMessage from './LoadingMessage';
import { history } from './defaults';

function chunks(array, chunk_size) {
  var outputArray = [];
  while (array.length > 0)
    outputArray.push(array.splice(0, chunk_size));
  return outputArray;
}

const AlbumRow = ({array, spotifyApi}) => (
  <Row>
    {array.map(
      (element) => (
        <Col md={6} key={element.id}>
          <Album
            album={element}
            spotifyApi={spotifyApi} />
        </Col>
      )
    )}
  </Row>
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
          if (error.statusText == "Unauthorized") {
            this.props.queryAccessToken();
          } else {
            console.log(error)
          }})
    }
  }

  saveAlbums(albumArray) {
    this.setState({albums: albumArray, loading: false})
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
      return (<Grid>
          {chunks(array, 2).map(
            (array) => (
              <AlbumRow spotifyApi={this.props.spotifyApi} array={array} />
            )
          )}
        </Grid>)
    }
  }

  returnToSearch() {
    history.push("/")
  }

  render() {
    return (<Grid>
        <h3>{ this.props.artistName ? this.props.artistName + "'s Albums": "Albums"}
        </h3>
         <Button
          bsStyle="info"
          bsSize="small"
          onClick={this.returnToSearch}>
          Back To Search
        </Button>

        <hr />
      { this.albumsDisplay(this.state.albums) }
      </Grid>)
  }
}

export default ArtistDisplay;