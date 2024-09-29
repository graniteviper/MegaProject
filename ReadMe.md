# Project starts...

**The project is under construction.**

_Read about process.exit_

1. Define a file structure
    -
2. Set up the project on GITHUB.
    -
3. Setting up the database:
    -
    - Name the database in `constants` file.
    - Install the required npm packages like `mongoose` and `express`.
    - Define a function in `db/index.js` to connect with the database.
    - connect with the database in the `index.js` file.
4. Call the required middlewares in the `app.js` file.
    -
5. Create the database and models using mongoose in the `models` folder.
    -
    - Bcrypt and JWT are used in these files.
    ```
    npm i bcrypt jsonwebtoken
    ```
    - Define `apiResponse`, `apierror` and `asyncHandler` in the utils file.
6. Setting up Cloudinary to handle file uploading.
    -
    - Set up account on [Cloudinary](https://cloudinary.com/ "Visit Cloudinary")
    - Read about `multer` and `fs` module.
    ```
    npm i multer
    ```
    - Configure cloudinary and define a function to upload files in `utils/cloudinary.js`.
    - Define a middleware in `middleware` to handle unlinking file from local server using multer.
7. Setting up of routes and controllers
    -
    - 