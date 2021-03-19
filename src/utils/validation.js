const invalidField = (s, maxlen) => {
  if (s !== undefined && typeof s !== 'string') {
    return true;
  }

  if (maxlen && s && s.length) {
    return s.length > maxlen;
  }

  return false;
};

function isEmpty(s) {
  return s != null && !s;
}

function isInt(i) {
  return i !== '' && Number.isInteger(Number(i));
}

function isString(s) {
  return typeof s === 'string';
}

function isBoolean(b) {
  return typeof b === 'boolean';
}

function isDate(d) {
  const valid = (new Date(d)).getTime() > 0;
  return valid;
}

function lengthValidationError(s, min, max) {
  const length = s && s.length ? s.length : 'undefined';

  const minMsg = min ? `at least ${min} characters` : '';
  const maxMsg = max ? `at most ${max} characters` : '';
  const msg = [minMsg, maxMsg].filter(Boolean).join(', ');
  const lenMsg = `Current length is ${length}.`;

  return `Must be non empty string ${msg}. ${lenMsg}`;
}

function isNotEmptyString(s, { min = undefined, max = undefined } = {}) {
  if (typeof s !== 'string' || s.length === 0) {
    return false;
  }

  if (max && s.length > max) {
    return false;
  }

  if (min && s.length < min) {
    return false;
  }

  return true;
}

function toPositiveNumberOrDefault(value, defaultValue) {
  const cast = Number(value);
  const clean = Number.isInteger(cast) && cast > 0 ? cast : defaultValue;

  return clean;
}

async function validateSeries({
  name,
  airDate,
  inProduction,
  tagline,
  image,
  description,
  language,
  network,
  url,
} = {}, patch = false) {
  const messages = [];

  if (!patch || name || isEmpty(name)) {
    if ((typeof name !== 'string' || name.length === 0 || name.length > 255)) {
      messages.push({
        field: 'name',
        message: 'Name is required and must not be empty and no longer than 255 charcters',
      });
    }
  }

  if (!isDate(airDate)) {
    messages.push({
      field: 'airDate',
      message: 'airDate must be a date',
    });
  }

  if (language !== undefined
    && (typeof language !== 'string' || (language.length !== 2 && language.length !== 0))) {
    messages.push({
      field: 'language',
      message: 'Language must be a string of length 2',
    });
  }

  if (!isBoolean(inProduction)) {
    messages.push({
      field: 'inProduction',
      message: 'inProduction must be of type boolean',
    });
  }

  if (invalidField(tagline)) {
    messages.push({
      field: 'tagline',
      message: 'Tagline must be a string',
    });
  }

  if (invalidField(image)) {
    messages.push({
      field: 'image',
      message: 'Image must be a path to an image',
    });
  }

  if (invalidField(description)) {
    messages.push({
      field: 'description',
      message: 'Description must be a string',
    });
  }

  if (invalidField(network)) {
    messages.push({
      field: 'network',
      message: 'Network must be a string',
    });
  }

  if (invalidField(url)) {
    messages.push({
      field: 'url',
      message: 'url must be a string',
    });
  }

  return messages;
}

async function validateSeason({
  name,
  number,
  airDate,
  overview,
  poster,
} = {}, patch = false) {
  const messages = [];

  if (!patch || name || isEmpty(name)) {
    if ((typeof name !== 'string' || name.length === 0 || name.length > 255)) {
      messages.push({
        field: 'name',
        message: 'Name is required and must not be empty and no longer than 255 charcters',
      });
    }
  }

  if (!isInt(number) && Number(number) > 0) {
    messages.push({
      field: 'number',
      message: 'number is required and must be an integer larger than 0',
    });
  }

  if (!isDate(airDate)) {
    messages.push({
      field: 'airDate',
      message: 'airDate must be a date',
    });
  }

  if (invalidField(poster)) {
    messages.push({
      field: 'poster',
      message: 'Poster must be a path to an image',
    });
  }

  if (invalidField(overview)) {
    messages.push({
      field: 'overview',
      message: 'Overview must be a string',
    });
  }
}

export {
  isEmpty,
  isString,
  isBoolean,
  isInt,
  isNotEmptyString,
  toPositiveNumberOrDefault,
  lengthValidationError,
  validateSeries,
  validateSeason,
};
