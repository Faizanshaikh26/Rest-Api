const express = require("express");
const Album = require("../models/Album");

const allAlbums = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "title",
    order = "asc",
    genre,
    artist,
  } = req.query;
  const filter = {};
  if (genre) filter.genre = genre;
  if (artist) filter["songs.artist"] = artist;

  try {
    const albums = await Album.find(filter)
      .limit(Number(limit))
      .skip((page - 1) * limit)
      .sort({ [sortBy]: order === "asc" ? 1 : -1 });

    const count = await Album.countDocuments(filter);
    res.json({
      albums,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const allAlbumsById = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ message: "Cannot find album" });
    }
    res.json(album);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateAlbum = async (req, res) => {
  const { id } = req.params;
  try {
    const album = await Album.findByIdAndUpdate(
      id,
      {
        $set: req.body,
      },
      { new: true }
    );

    if (!album) {
      return res.status(404).json({ message: "Cannot find album" });
    }

    const updatedAlbum = await album.save();
    res.json(updatedAlbum);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ message: "Cannot find album" });
    }
    await album.deleteOne(); // Corrected method
    res.json({ message: "Deleted album", album: album });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const newAlbum = async (req, res) => {
  const album = new Album({
    title: req.body.title,
    description: req.body.description,
    genre: req.body.genre,
    albumImage: req.body.albumImage,
    songs: req.body.songs,
  });
  try {
    const newAlbum = await album.save();
    res.status(201).json(newAlbum);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const searchAlbums = async (req, res) => {
  try {
    const searchTerm = req.query.q;
    if (!searchTerm) {
      return res.status(400).json({ message: "Search term is required" });
    }

    const regex = new RegExp(searchTerm, "i"); // Case-insensitive regex search

    // First, try to find albums that match the search term
    const albumQuery = {
      $or: [
        { title: regex },
        { description: regex },
        { genre: regex },
        { albumImage: regex },
      ],
    };

    let albums = await Album.find(albumQuery).exec();

    // If no albums are found, search for songs
    if (albums.length === 0) {
      const songPipeline = [
        { $unwind: "$songs" }, // Unwind the songs array
        {
          $match: {
            $or: [{ "songs.title": regex }, { "songs.artist": regex }],
          },
        },
        {
          $group: {
            _id: "$_id",
            title: { $first: "$title" },
            description: { $first: "$description" },
            genre: { $first: "$genre" },
            albumImage: { $first: "$albumImage" },
            songs: { $push: "$songs" },
            bgcolor: { $first: "$bgcolor" },
            created_at: { $first: "$created_at" },
          },
        },
      ];

      albums = await Album.aggregate(songPipeline).exec();
    }

    res.json(albums);
  } catch (err) {
    console.error("Error during search:", err); // Log any errors
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  allAlbums,
  allAlbumsById,
  newAlbum,
  updateAlbum,
  deleteAlbum,
  searchAlbums,
};
