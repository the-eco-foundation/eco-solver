# Running

In order to run the project, you need to have `aws-sso` installed in your machine. This is due to us fetching configurations from the [SecretsManager](https://aws.amazon.com/secrets-manager/).

```
 aws-sso exec
```

Then select the account through the terminal for development:`AccountAlias development arn:aws:iam::599439662368:role/AWSAdministratorAccess)`

You can also just run:

```
aws-sso exec -S "EcoSSO" --arn arn:aws:iam::599439662368:role/AWSAdministratorAccess
```

You also need to run the redis and mongodb instances for our queue and db services:

```
redis-server
```

You need to run a [mongodb](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/):

```
brew services start mongodb-community
brew services list
brew services stop mongodb-community
```
