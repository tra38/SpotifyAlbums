import React, { Component } from 'react';

// React-Bootstrap Imports
import Media from 'react-bootstrap/lib/Media';
import Table from 'react-bootstrap/lib/Table';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';

//Other dependencies
import LoadingMessage from './LoadingMessage';

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
          <tr key={song.id}>
            <th>{song.name}</th>
            <th>{convertTime(song.duration_ms)}</th>
          </tr>
        )
      )}
    </tbody>
  </Table>
);

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
         className="line-wrap"
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

export default Album;