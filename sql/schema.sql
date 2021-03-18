CREATE TABLE series (
    id SERIAL PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    airDate TIMESTAMP WITH TIME ZONE,
    inProduction BOOLEAN,
    tagline VARCHAR(256),
    image VARCHAR(256),
    description TEXT,
    language VARCHAR(256),
    network VARCHAR(256),
    url VARCHAR(256)
);

CREATE TABLE genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(256) NOT NULL
);

CREATE TABLE serie_genre (
    id SERIAL PRIMARY KEY,
    serie INTEGER NOT NULL,
    genre INTEGER NOT NULL,
    CONSTRAINT serie FOREIGN KEY (serie) REFERENCES series (id),
    CONSTRAINT genre FOREIGN KEY (genre) REFERENCES genres (id)
);

CREATE TABLE seasons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    number INTEGER NOT NULL CHECK (number > 0),
    airDate TIMESTAMP WITH TIME ZONE,
    overview TEXT,
    poster VARCHAR(256) NOT NULL,
    serie INTEGER NOT NULL,
    CONSTRAINT serie FOREIGN KEY (serie) REFERENCES series (id)
);

CREATE TABLE episodes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    number INTEGER NOT NULL CHECK (number > 0),
    airDate TIMESTAMP WITH TIME ZONE,
    overview TEXT,
    season INTEGER NOT NULL,
    serie INTEGER NOT NULL,
    CONSTRAINT season FOREIGN KEY (season) REFERENCES seasons (id),
    CONSTRAINT serie FOREIGN KEY (serie) REFERENCES series (id)
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(256) NOT NULL UNIQUE,
    email VARCHAR(256) NOT NULL UNIQUE,
    password VARCHAR(128) NOT NULL,
    admin BOOLEAN DEFAULT false
);

CREATE TYPE state AS ENUM ('langar að horfa', 'er að horfa', 'hef horft');

CREATE TABLE users_series (
  id SERIAL PRIMARY KEY,
  "user" INTEGER NOT NULL,
  serie INTEGER NOT NULL,
  state state, -- ENUM fyrir states
  rating INTEGER CHECK (rating > -1 AND rating < 6),
  CONSTRAINT serie FOREIGN KEY (serie) REFERENCES series (id),
  CONSTRAINT "user" FOREIGN KEY ("user") REFERENCES users (id)
);
