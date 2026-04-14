# Virtual Cohesion Dev Setup

This document outlines the steps to get the Virtual Cohesion application running locally for development purposes.

## Prerequisites

- Docker
- Docker Compose

Make sure you have Docker and Docker Compose installed on your system.

## Running the Application

1.  Open a terminal in the root of the project.
2.  Run the following command:

    ```bash
    docker-compose up
    ```

    This will build the containers for the backend, frontend, and database, and start the application. The backend will be seeded with initial data for the demo.

## Accessing the Application

Once the containers are up and running, you can access the application in your browser at:

[http://demo.localhost/](http://demo.localhost/)

**Note:** You must use `demo.localhost` and not `localhost` to access the tenant-specific routes.

## Demo Credentials

The application is seeded with the following user accounts for the `demo` tenant:

-   **HR Head:**
    -   **Email:** `hr@demo.local`
    -   **Password:** `ChangeMe123!`
-   **Employee:**
    -   **Email:** `employee@demo.local`
    -   **Password:** `ChangeMe123!`

## Registering a New User

You can also register a new user with the role of "New Hire".

1.  When you run `docker-compose up`, the `seed_demo` command will output an invite token to the console. Look for a line similar to this:

    ```
    Register with invite_token: <some-long-token-here>
    ```

2.  Navigate to the registration page (or be redirected when trying to access a protected page).
3.  Use the invite token from the console and the email `newhire@demo.local` to register a new account.
