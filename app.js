const express = require("express");
const app = express();
require("./db/connection");
const path = require("path");
const compression = require('compression');
app.use(compression());

const port = process.env.PORT || 8000;
const bodyParser = require("body-parser");
const cors = require("cors");
const albumsControllers = require("./Controllers/albums");

const usersControllers=require('./Controllers/Users')
const playlistRoutes = require('./routes/playlisRoutes');
require("dotenv").config();

app.use(bodyParser.json());
app.use("/images", express.static(path.join(__dirname, "Images")));
app.use("/songurl", express.static(path.join(__dirname, "Songurl")));
app.use(cors({
  origin: 'http://localhost:5173',  // Adjust this to your frontend's URL
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.use('/api', playlistRoutes);
app.get("/", albumsControllers.allAlbums);
app.get("/testing", albumsControllers.allAlbums);

app.get("/api/search", albumsControllers.searchAlbums);
app.get("/api/:id", albumsControllers.allAlbumsById);
app.post("/api/albums", albumsControllers.newAlbum);
app.post("/api/testing", albumsControllers.newAlbum);

app.put("/api/:id", albumsControllers.updateAlbum);
app.delete("/api/:id", albumsControllers.deleteAlbum);

app.post("/login",usersControllers.login)
app.post("/signUp",usersControllers.signUp)

app.listen(port, () => console.log("Server is running on port", port));
