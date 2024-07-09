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