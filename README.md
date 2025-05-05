# Social Media Analyzer Project

This project allows analyzing social media data stored in a MySQL database via a React frontend and a Node.js backend.

## Prerequisites

1.  **Docker:** You need Docker installed and running on your machine. Download and install Docker Desktop (Windows/macOS) or Docker Engine + Compose (Linux) from [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/).
2.  **Node.js & npm:** Required for running the backend and frontend development servers. Download from [https://nodejs.org/](https://nodejs.org/).

## Setup and Running

1.  **Clone the Repository:**
    ```bash
    git clone <your-repo-url>
    cd social-media-analyzer
    ```

2.  **Configure Database Credentials (Optional - Defaults Provided):**
    *   A `.env` file is included in the root directory with default database credentials used by Docker Compose (`DB_NAME`, `DB_USER`, `DB_PASSWORD`).
    *   The `backend/.env` file is configured to use these defaults. You generally shouldn't need to change these for local testing.

3.  **Start the Database:**
    *   Open a terminal in the project's **root** directory (where `docker-compose.yml` is located).
    *   Run the following command to start the MySQL database container in the background:
        ```bash
        docker-compose up -d
        ```
    *   On the *first run*, Docker will download the MySQL image and initialize the database using the `db/schema.sql` file. This might take a minute or two.
    *   You can check the logs using `docker-compose logs -f db`. Press `Ctrl+C` to stop viewing logs.

4.  **Install Backend Dependencies:**
    ```bash
    cd backend
    npm install
    ```

5.  **Run the Backend Server:**
    *   While still in the `backend` directory:
        ```bash
        node server.js
        ```
    *   The API server should start, likely on port 3001. It will connect to the MySQL database running in Docker.

6.  **Install Frontend Dependencies:**
    *   Open a **new terminal** in the `frontend` directory:
        ```bash
        cd ../frontend
        # Or from root: cd frontend
        npm install
        ```

7.  **Run the Frontend Application:**
    *   While still in the `frontend` directory:
        ```bash
        npm start
        ```
    *   This should open the React application in your web browser (usually `http://localhost:3000`).

## Stopping the Application

1.  **Stop the Frontend:** Press `Ctrl+C` in the frontend terminal.
2.  **Stop the Backend:** Press `Ctrl+C` in the backend terminal.
3.  **Stop the Database Container:**
    *   In a terminal in the project's **root** directory:
        ```bash
        docker-compose down
        ```
    *   This stops and removes the container but keeps the data stored in the `mysql_data` volume.

## Database Access (Optional)

*   You can connect to the database using a client like MySQL Workbench, DBeaver, or the command line.
*   **Host:** `localhost`
*   **Port:** `3311`
*   **User:** `app_user` (or the value of `DB_USER`)
*   **Password:** `app_password` (or the value of `DB_PASSWORD`)
*   **Database/Schema:** `social_media_db` (or the value of `DB_NAME`)
*   You can also connect as `root` using the `MYSQL_ROOT_PASSWORD` if needed. 