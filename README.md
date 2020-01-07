# Candids (backend)
It is an internal application, that we made for sharing Candid Moments within the company.

## Setting up Dev Environment

### Cloning the Repository:

Using SSH
```
git clone git@github.com:DivyanshBatham/cb-candids-backend.git
```
or Using HTTPS
```
git clone https://github.com/DivyanshBatham/cb-candids-backend.git
```

### Installing Dependencies:

```
cd cb-candids-backend
npm install
```

### Creating `.env` file:
Create a `.env` file in the root of the project folder, use `.env.sample` for the variables names.

#### Getting the values for `.env`:

* `URI`: Go to MongoDB Atlas, create a project then get the URI from connect.
* `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: Not required as Passport.js is not being used anymore.
* `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`: Login to AWS Console, Goto IAM, Create a User with Programatic Access and get the credentials.
