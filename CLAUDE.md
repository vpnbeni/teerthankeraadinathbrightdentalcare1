# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

This repository is a monorepo containing three separate applications:

- **`client/`**: A React-based single-page application for patients/users. It handles appointment booking, user profiles, and payments.
- **`admin/`**: A React-based single-page application for administrators. It provides an interface for managing appointments, users, and viewing analytics.
- **`server/`**: A Node.js/Express backend that serves a RESTful API to both the client and admin applications. It uses MongoDB for data storage via Mongoose.

The server application follows a standard MVC-like pattern, with code organized into `routes`, `controllers`, `models`, `services`, and `middleware`.

## Common Commands

### Running the applications

To run the full application, you need to start the client, admin, and server applications in separate terminals.

- **Client**:

  ```bash
  cd client
  npm install
  npm run dev
  ```

- **Admin**:

  ```bash
  cd admin
  npm install
  npm run dev
  ```

- **Server**:
  ```bash
  cd server
  npm install
  npm run dev
  ```

### Running Tests

- **Client Tests**: The client app uses Vitest.

  ```bash
  cd client
  npm test
  ```

- **Admin Tests**: The admin app also uses Vitest.

  ```bash
  cd admin
  npm test
  ```

- **Server Tests**: The server uses Jest.
  ```bash
  cd server
  npm test
  ```

### Linting

- **Client Linting**:

  ```bash
  cd client
  npm run lint
  ```

- **Admin Linting**:
  ```bash
  cd admin
  npm run lint
  ```
