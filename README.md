# LeanQueue

LeanQueue is a Node.js application designed to manage task queues. It uses Express as a web framework and PostgreSQL for data storage.

## Features

-   **Queue Management:** Create and manage task queues dynamically.
-   **Task Handling:** Add tasks to queues and retrieve them for processing.
-   **Result Submission:** Submit results for completed tasks.

## Built With

-   [Node.js](https://nodejs.org/) - JavaScript runtime.
-   [Express](https://expressjs.com/) - Web framework for Node.js.
-   [PostgreSQL](https://www.postgresql.org/) - Open-source relational database.

## Prerequisites

-   [Node.js](https://nodejs.org/)
-   [Typescript](https://www.typescriptlang.org/)
-   [Jest](https://jestjs.io/)
-   [PostgreSQL](https://www.postgresql.org/)

## Installation

1. Clone the repository:

    ```bash
    git clone git@github.com:vixhnuchandran/lean-queue.git
    ```

2. Navigate to the project directory:

    ```bash
    cd lean-queue
    ```

3. Install dependencies:

    ```bash
    pnpm install
    ```

## Usage

1. Build the project:

    ```bash
    pnpm run build
    ```

2. Start the server:

    ```bash
    pnpm start
    ```

3. The server will start running at `http://localhost:8484`.

## Structure

-   `app.ts`: Contains the main application logic, including middleware setup and route handling using Express.
-   `database.ts`: Manages the connection to the PostgreSQL database using the pg library.
-   `error.ts`: Defines custom error classes and error handling middleware.
-   `middlewares.ts`: Contains middleware functions, such as attaching a unique request ID and query manager to each request.
-   `model.ts`: Handles file operations and database queries related to creating tables.
-   `QueryManager.ts`: Manages database queries and interactions with the PostgreSQL database.
-   `query.sql`: Contains SQL queries for creating database tables.
-   `routes/`: Directory containing route handlers and endpoint definitions.
-   `server.ts`: Sets up the Express server and listens for incoming HTTP requests.
-   `types.ts`: Defines TypeScript types and interfaces used throughout the project.
-   `utils/logger.ts`: Provides logging functionality for the application.
-   `validations.ts`: Contains validation functions for request bodies and parameters.

## Endpoints

The application exposes the following endpoints:

-   `/create-queue`: Endpoint to create a new queue with specified type, tasks, options, and notes.
-   `/add-tasks`: Add tasks to an existing queue identified by its ID.
-   `/next-available-task`: Retrieve the next available task based on queue, type, or tags.
-   `/submit-results`: Submit task results including task ID, result data, and any errors encountered.
-   `/get-results/:queue`: Retrieve results of completed tasks for specified queue ID.
-   `/check-queue`: Check status of a queue based on type or ID.
-   `/completed-results/:queue`: Retrieve completed results for specified queue ID.
-   `/status/:queue`: Retrieve status of a queue including total tasks, completed tasks, and error count.
-   `/delete-queue/:queue`: Delete queue with specified ID.
-   `/delete-everything`: Delete all queues and associated tasks.
-   `/tasks-stats`: Retrieve statistics about tasks based on a specified time interval.
-   `/recent-queues`: Retrieve information about recently created queues.
-   `/queues-details`: Retrieve details about all queues.
-   `/get-queue-details/:queue`: Retrieve details about a specific queue identified by its ID.
-   `/queue-counts`: Retrieve counts of queues and tasks.
-   `/get-tasks-details`: Retrieve details about tasks associated with specific queues.

## Error Handling

Errors in the application are handled as follows:

-   Custom error classes, such as `QueueError` and `ValidationError`, are defined in `error.ts` to handle specific types of errors.
-   Middleware functions in `middlewares.ts` handle errors and return appropriate HTTP responses based on error type.
-   Error messages include relevant details, such as error codes and descriptions, to provide clarity on encountered issues.

## License

This project is licensed under the MIT License
