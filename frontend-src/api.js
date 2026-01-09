const PREFIX = "";

const req = (url, options = {}) => {
  const { body } = options;

  return fetch((PREFIX + url).replace(/\/\/$/, ""), {
    ...options,
    body: body ? JSON.stringify(body) : null,
    headers: {
      ...options.headers,
      ...(body
        ? {
            "Content-Type": "application/json",
          }
        : null),
    },
  }).then((res) =>
    res.ok
      ? res.json()
      : res.text().then((message) => {
          throw new Error(message);
        })
  );
};

export const getNotes = ({ age, search, page, archive } = {}) => {
  const params = new URLSearchParams();
  if (age) params.append("age", age);
  if (search) params.append("search", search);
  if (page) params.append("page", page);
  if (archive) params.append("archive", archive);

  return req(`/dashboard/notes?${params}`);
};

export const createNote = (title, text) => {
  return req(`/dashboard/notes`, {
    method: "POST",
    body: { title, content: text },
  });
};

export const getNote = (id) => {
  return req(`/dashboard/notes/${id}`);
};

export const editNote = (id, title, text) => {
  return req(`/dashboard/notes/${id}`, {
    method: "PUT",
    body: { title, content: text },
  });
};

export const archiveNote = (id) => {
  return req(`/dashboard/notes/${id}/archive`, {
    method: "POST",
  });
};

export const unarchiveNote = (id) => {
  return req(`/dashboard/notes/${id}/unarchive`, {
    method: "POST",
  });
};


export const deleteNote = (id) => {
  return req(`/dashboard/notes/${id}`, {
    method: "DELETE",
  });
};

export const deleteAllArchived = () => {
  return req(`/dashboard/notes/archive/all`, {
    method: "DELETE",
  });
};

export const notePdfUrl = (id) => {};
