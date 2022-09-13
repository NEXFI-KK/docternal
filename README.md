# Docternal

Docternal is an internal documentation hosting server for hosting internal/customer facing documentation.

Tools like Doxygen, jsdoc, etc. make generating documentation extremely simple... but hosting is another story.
GitHub Pages allows you to host your documentation publicly, but for internal or specific customer facing documentation it's not ideal.

Docternal uses S3 buckets and a configuration file in the S3 root.
This way CI jobs can simply populate the S3 bucket with generated documentation files and Docternal can handle authentication.

## Configuration

The documentation root in S3 should use the following structure:

* `root`
    * `docternal.yaml` - Docternal config file.
    * `{project}`
        * `{lang}` - ISO 639 language code of translated docs.
            * `{version}` - Version tag of documentation.

For example, a project called `cool-sdk` could make use of the following paths:

* `/root/cool-sdk/en/latest`
* `/root/cool-sdk/en/v1.0.0`
* `/root/cool-sdk/ja/latest`
* `/root/cool-sdk/ja/v1.0.0`

The configuration file defines simple permissions and routing rules for each project:

```yaml
version: 1
sites:

  # cool-sdk.mycompany.com/en/latest
  - project: cool-sdk
    domain: cool-sdk.mycompany.com
    permissions:
      google:
        domains: mycompany.com
      microsoft:
        domains: favorite-partner.com

  # docsite.com/other-sdk/en/latest
  - project: other-sdk
    domain: docsite.com
    path: /other-sdk
    permissions:
      google:
        domains: mycompany.com
      basic_auth:
        username: doc-viewer@dinosaur.com
        password: <Bcrypt password hash>

```

Settings besides routing rules are passed as environment variables:

| Name | Required | Default | Description |
| -- | -- | -- | -- |
| PORT | no | `8080` | Port the server should listen on. |
| S3_BUCKET_NAME | yes | N/A | S3 bucket path where the documentation is stored. |
| AWS_REGION | yes | N/A | AWS region where the bucket is hosted. |
| AWS_ACCESS_KEY_ID | yes | N/A | AWS Access Key ID. |
| AWS_SECRET_ACCESS_KEY | yes | N/A | AWS Secret Access Key. |
| ROOT_DOCS_PATH | no | empty | Root path inside the S3 bucket where documentation files are stored. |
| LOCAL_USERS | no | empty | List of usernames and passwords for basic local user login in the format `username:password`. Multiple entries can be separated by commas. |
| GOOGLE_CLIENT_ID | if using Google login | empty | Google OAuth 2.0 Client ID. |
| GOOGLE_CLIENT_SECRET | if using Google login | empty | Google OAuth 2.0 Client Secret |
| GOOGLE_CALLBACK_URL | if using Google login | empty | OAuth callback URL for Google login. Should be `https://{your_domain}/auth/google/callback` |