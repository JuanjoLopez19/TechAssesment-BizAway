export default {
  // Error messages
  400: {
    BODY_EMPTY: {
      SHORT: 'Body cannot be empty.',
      LONG: 'Body cannot be empty, please provide the body in the request.',
    },
    PARAMS_EMPTY: {
      SHORT: 'Params cannot be empty.',
      LONG: 'Params cannot be empty, please provide the params in the request.',
    },
    QUERY_CANNOT_BE_EMPTY: {
      SHORT: 'Query cannot be empty.',
      LONG: 'Query cannot be empty, please provide the query in the request.',
    },
    MISSING_PARAMETERS_BODY: {
      SHORT: 'Missing parameters.',
      LONG: 'Missing parameters in body.',
    },
    MISSING_PARAMETERS_QUERY: {
      SHORT: 'Missing parameters.',
      LONG: 'Missing parameters in the query params.',
    },
    MISSING_PARAMETERS_PARAMS: {
      SHORT: 'Missing parameters.',
      LONG: 'Missing parameters in the params.',
    },
    ALREADY_EXISTS: {
      SHORT: 'Already exists.',
      LONG: 'The resource already exists.',
    },
    JWT_NULL: {
      SHORT: 'JWT is null.',
      LONG: 'JWT not found in headers, please provide JWT in headers with key x-access-token.',
    },
    JWT_NOT_FOUND: {
      SHORT: 'JWT not found.',
      LONG: 'JWT not found in headers.',
    },
    FILE_EMPTY: {
      SHORT: 'File cannot be empty.',
      LONG: 'File cannot be empty, please provide the file in the request.',
    },
    NAME_ALREADY_USED: {
      SHORT: 'Name already used.',
      LONG: 'Name already used, please provide a different name.',
    },
    ALREADY_APPLIED: {
      SHORT: 'Already applied.',
      LONG: 'Already applied to this job offer.',
    },
    ALREADY_MANAGED: {
      SHORT: 'Already managed.',
      LONG: 'Already managed this job offer.',
    },
    INVALID_SITE: {
      SHORT: 'Invalid site.',
      LONG: 'Invalid site, please provide a valid site.',
    },
    ALREADY_ACTIVATED: {
      SHORT: 'Already activated.',
      LONG: 'Already activated, please provide a valid user.',
    },
    MISSING_HEADER: {
      SHORT: 'Missing header.',
      LONG: 'Missing header, please provide a valid header.',
    },
    BAD_REQUEST: {
      SHORT: 'Bad request.',
      LONG: 'Bad request, please provide a valid request.',
    },
  },
  401: {
    NO_TOKEN_PROVIDED: {
      SHORT: 'No token provided.',
      LONG: 'No token provided, please provide a valid token.',
    },
    INVALID_TOKEN: {
      SHORT: 'Invalid token.',
      LONG: 'Invalid token, please provide a valid token.',
    },
    UNAUTHORIZED: {
      SHORT: 'Unauthorized.',
      LONG: 'Unauthorized, please provide a valid username.',
    },
    INVALID_PWD: {
      SHORT: 'Invalid password.',
      LONG: "Invalid password, the password given doesn't match with the stored in database.",
    },
    JWT_NOT_VALID: {
      SHORT: 'JWT is not valid.',
      LONG: 'JWT decoded but is not a valid one.',
    },
    JWT_EXPIRED: {
      SHORT: 'JWT is expired.',
      LONG: 'JWT decoded but is expired.',
    },
    JWT_ERROR: {
      SHORT: 'User not found.',
      LONG: 'User not found by the decoded token id.',
    },
  },
  403: {
    FORBIDDEN: {
      SHORT: 'Forbidden.',
      LONG: 'Forbidden, please provide a valid token.',
    },
  },
  404: {
    NOT_FOUND: {
      SHORT: 'Not found.',
      LONG: 'Not found, please provide a valid id.',
    },
  },
  409: {
    CONFLICT_UPDATE: {
      SHORT: 'Error on update.',
      LONG: 'Error occurred during update.',
    },
    EMAIL_IN_USE: {
      SHORT: 'Email already in use.',
      LONG: 'Email already in use, please provide a different email.',
    },
    USERNAME_IN_USE: {
      SHORT: 'Username already in use.',
      LONG: 'Username already in use, please provide a different username.',
    },
  },
  500: {
    INTERNAL_SERVER_ERROR: {
      SHORT: 'Internal server error.',
      LONG: 'Internal server error, please try again later.',
    },
    BYCRYPT_SALT_ERROR: {
      SHORT: 'Bycrypt salt generation error.',
      LONG: 'Error occurred during bcrypt salt generation.',
    },
    BYCRYPT_HASH_ERROR: {
      SHORT: 'Bycrypt hash generation error.',
      LONG: 'Error occurred during bcrypt hash generation.',
    },
    SMTP_VERIFY_ERROR: {
      SHORT: 'SMTP server error.',
      LONG: 'SMTP server error occurred during verification.',
    },
    SMTP_SEND_ERROR: {
      SHORT: 'SMTP server error.',
      LONG: 'SMTP server error occurred while sending the email.',
    },
    USER_NOT_ACTIVATED: {
      SHORT: 'User not activated.',
      LONG: 'User not activated, please activate the user.',
    },
  },
  // Success messages
  200: {
    SMTP_EMAIL_SENT: {
      SHORT: 'Email successfully sent!',
      LONG: 'Email successfully sent!',
    },
    USER_ACTIVATED: {
      SHORT: 'User activated!',
      LONG: 'User activated successfully!',
    },
    PASSWORD_CHANGED: {
      SHORT: 'Password changed successfully!',
      LONG: 'Password changed successfully!',
    },
    UPDATED_SUCCESSFULLY: {
      SHORT: 'Updated successfully!',
      LONG: 'Updated successfully!',
    },
    DELETED_SUCCESSFULLY: {
      SHORT: 'Deleted successfully!',
      LONG: 'Deleted successfully!',
    },
    USER_CREATED: {
      SHORT: 'User created!',
      LONG: 'User created successfully!',
    },
    REMEMBER_PWD_EMAIL: {
      SHORT: 'Remember password email sent!',
      LONG: 'Remember password email sent successfully!',
    },
    LANGUAGE_SERVICE_FOUND: {
      SHORT: 'Language Service found successfully.',
      LONG: 'Language Service found successfully.',
    },
    COURSES_FOUND: {
      SHORT: 'Courses found successfully.',
      LONG: 'Courses found successfully.',
    },
    APPS_FOUND: {
      SHORT: 'Apps found successfully.',
      LONG: 'Apps found successfully.',
    },
    MODELS_FOUND: {
      SHORT: 'Models found successfully.',
      LONG: 'Models found successfully.',
    },
    OK: {
      SHORT: 'OK',
      LONG: 'OK',
    },
    NO_USERS_FOUND: {
      SHORT: 'No users found.',
      LONG: 'No users found.',
    },
    USER_FOUND: {
      SHORT: 'User found.',
      LONG: 'User found.',
    },
    COMPANY_FOUND: {
      SHORT: 'Company found.',
      LONG: 'Company found.',
    },
  },
  201: {
    CREATED_SUCCESSFULLY: {
      SHORT: 'Created successfully!',
      LONG: 'Created successfully!',
    },
    LANGUAGE_SERVICE_CREATED: {
      SHORT: 'Language Service created successfully.',
      LONG: 'Language Service created successfully.',
    },
    DATASET_CREATED: {
      SHORT: 'Dataset created successfully.',
      LONG: 'Dataset created successfully.',
    },
  },
  204: {
    NO_CONTENT: {
      SHORT: 'No content.',
      LONG: 'No content found.',
    },
  },
  501: {
    NOT_IMPLEMENTED: {
      SHORT: 'Not implemented.',
      LONG: 'Not implemented.',
    },
  },
};
