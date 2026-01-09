const express = require("express");
const { auth } = require("./auth.js");
const { nanoid } = require("nanoid");
const marked = require("marked");

const router = express.Router();

const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.PGHOST,
    port: process.env.DBPORT || 5432,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
  },
});

marked.setOptions({
  breaks: true,
});

const findNotesByUser = async (userId, filters = {}) => {
  const { age, search, page = 1, archive = false, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  let query = knex("notes").where({ userId });

  query = query.where({ isArchived: archive });

  if (age && age !== "alltime") {
    const date = new Date();
    switch (age) {
      case "week":
        date.setDate(date.getDate() - 7);
        break;
      case "1month":
        date.setMonth(date.getMonth() - 1);
        break;
      case "3months":
        date.setMonth(date.getMonth() - 3);
        break;
      default:
        date.setDate(date.getDate() - 7);
    }
    query = query.where("createdAt", ">=", date);
  }

  if (search) {
    query = query.where("title", "ilike", `%${search}%`);
  }

  const totalResult = await query.clone().count("noteId as count").first();
  const total = parseInt(totalResult.count);

  const notes = await query.select("*").orderBy("createdAt", "desc").limit(limit).offset(offset);

  const transformedNotes = notes.map((note) => ({
    ...note,
    created: note.createdAt,
    html: marked.parse(note.content || ""),
  }));

  return {
    data: transformedNotes,
    hasMore: offset + notes.length < total,
  };
};

const createNote = async (userId, title, content) => {
  const [note] = await knex("notes")
    .insert({
      noteId: nanoid(),
      userId,
      title,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
    })
    .returning("*");
  return {
    ...note,
    created: note.createdAt,
    html: marked.parse(note.content || ""),
  };
};

const checkNoteAccess = () => async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const note = await findNoteById(id, userId);
  if (!note) {
    return res.sendStatus(404);
  }

  req.note = {
    ...note,
    created: note.createdAt,
    html: marked.parse(note.content || ""),
  };
  next();
};

const findNoteById = async (noteId, userId) => {
  return knex("notes").where({ noteId, userId }).first();
};

const updateNote = async (noteId, userId, data) => {
  const [note] = await knex("notes")
    .where({ noteId, userId })
    .update({
      ...data,
      updatedAt: new Date(),
    })
    .returning("*");
  return {
    ...note,
    created: note.createdAt,
    html: marked.parse(note.content || ""),
    text: note.content,
  };
};

const deleteNote = async (noteId, userId) => {
  return await knex("notes").where({ noteId, userId }).delete();
};

router.get("/", auth(), async (req, res) => {
  if (!req.user) {
    return res.sendStatus(401);
  }

  const { age, search, page = 1} = req.query;
  const userId = req.user.id;

  const isArchiveMode = age === "archive";
  const actualAge = isArchiveMode ? "alltime" : age;

  const result = await findNotesByUser(userId, {
    age: actualAge,
    search,
    page: parseInt(page),
    archive: isArchiveMode,
  });

  res.status(200).json(result);
});

router.post("/", auth(), async (req, res) => {
  if (!req.user) {
    return res.sendStatus(401);
  }

  const { title, content } = req.body;
  const userId = req.user.id;

  if (!title || !content) {
    return res.sendStatus(400);
  }

  const note = await createNote(userId, title, content);

  res.status(201).json(note);
});

router.get("/:id", auth(), checkNoteAccess(), async (req, res) => {
  if (!req.user) {
    return res.sendStatus(401);
  }

  const originalNote = await findNoteById(req.params.id, req.user.id);

  const response = {
    ...req.note,
    text: originalNote.content,
  };

  res.status(200).json(response);
});

router.put("/:id", auth(), checkNoteAccess(), async (req, res) => {
  if (!req.user) {
    return res.sendStatus(401);
  }

  const { title, content } = req.body;

  if (!title || !content) {
    return res.sendStatus(400);
  }

  const updatedNote = await updateNote(req.params.id, req.user.id, {
    title,
    content,
  });

  res.status(201).json(updatedNote);
});

router.post("/:id/archive", auth(), checkNoteAccess(), async (req, res) => {
  if (!req.user) {
    return res.sendStatus(401);
  }

  if (req.note.isArchived) {
    return res.sendStatus(400);
  }

  const updatedNote = await updateNote(req.params.id, req.user.id, {
    isArchived: true,
  });

  res.status(200).json(updatedNote);
});

router.post("/:id/unarchive", auth(), checkNoteAccess(), async (req, res) => {
  if (!req.user) {
    return res.sendStatus(401);
  }

  if (!req.note.isArchived) {
    return res.sendStatus(400);
  }

  const updatedNote = await updateNote(req.params.id, req.user.id, {
    isArchived: false,
  });

  res.status(200).json(updatedNote);
});

router.delete("/:id", auth(), checkNoteAccess(), async (req, res) => {
  if (!req.user) {
    return res.sendStatus(401);
  }

  if (!req.note.isArchived) {
    return res.sendStatus(400);
  }

  await deleteNote(req.params.id, req.user.id);
  res.status(200).json({ message: "Note deleted successfully" });
});

router.delete("/archive/all", auth(), async (req, res) => {
  if (!req.user) {
    return res.sendStatus(401);
  }

  await knex("notes").where({ userId: req.user.id, isArchived: true }).delete();
  res.status(200).json({ message: "All notes deleted successfully" });
});

module.exports = router;
