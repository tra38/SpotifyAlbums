//History.js
import createHashHistory from 'history/createHashHistory'

const history = createHashHistory({ hashType: 'noslash' });

const apiUrl = process.env.NODE_ENV === 'production' ? "https://tra38.github.io/SpotifyAlbums/#/callback" : "http://localhost:3000/#/callback";

export { history, apiUrl }
