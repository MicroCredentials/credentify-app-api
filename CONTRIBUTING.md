# Contributing

The Credentify repository contains:

* **assets** Repository materials
* **docs** API documentation
* **source** API server source code

## Development

### Install MongoDB

Install the latest MongoDB v4.

```
$ docker run -d \
  --name mongo \
  -p 27017:27017 \
  -v ~/.docker/machine/volumes/mongo/4/data:/data/db \
  mongo:4
```

Open MongoDB console.

```
$ docker exec -it mongo /bin/bash -c 'mongo credentify'
```

### Configure environment

Create `.env` file with variables.

```
APP_ENV=development
APP_SECRET=nosecret
API_HOST=localhost
API_PORT=4444
MONGO_URL=mongodb://localhost:27017
MONGO_DB=credentify
MONGO_POOL=50
PAGE_DEFAULT_LIMIT=25
PAGE_MAX_LIMIT=100
SENDGRID_API_KEY=yourTokenHere
```

## Production

TODO

# Deployment

First make sure that you have to correct lamba configuration and API key. You can do this by going into `/bin/deploy/` and checking `claudia-dev.json`, `claudia.json` and `env.json` files. Follow steps bellow depending if you want to deploy for production or development.

## Development

- In source/bin/install.sh file make sure you run: `npm run dev:update`. If this is the first time you are deploying the API then change it to: `npm run dev:create`. 
- Run: `docker build -t credentify-app-api .`
- Run: `docker run --rm -e AWS_ACCESS_KEY_ID= -e AWS_SECRET_ACCESS_KEY= --rm -v $PWD:/app credentify-app-api`. Set the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` with actual keys.

## Production

- In source/bin/install.sh file make sure you run: `npm run update`. If this is the first time you are deploying the API then change it to: `npm run create`. 
- Run: `docker build -t credentify-app-api .`
- Run: `docker run --rm -e AWS_ACCESS_KEY_ID= -e AWS_SECRET_ACCESS_KEY= --rm -v $PWD:/app credentify-app-api`. Set the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` with actual keys.