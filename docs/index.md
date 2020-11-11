# REST

## Endpoints

Credentify application API is language independent software with a RESTful API endpoint built for the Credentify application UI. We use `staging` and `production` environments. Staging endpoint is a production endpoint replication, serving as a sandbox environment, where we test our code before we deploy it to the production servers. Production servers handle real users, real sandbox calls and hold real data.

Here is a list of available endpoints:

* **Staging**: https://staging.credentify.io/api
* **Production**: https://credentify.io/api

## Requests

The server speaks [JSON](https://en.wikipedia.org/wiki/JSON). It's recommended that every call to the server includes a `ContentType` header set to `application/json; charset=utf-8;`.

Requests with `POST` or `PUT` method must send data as `application/json` or `mutipart/form-data` when files are included in the request body.

```bash
$ curl -X 'POST' 'https://credentify.io/api/assets' \
       -H 'Authorization: JWT {token}' \
       -H 'Content-Type: application/json; charset=utf-8' \
       -d $'{}'
```

## Responses

Server response always reflects profile's abilities. This means that some routes return personalized data based on profile's permissions. Details about this are explained in later sections.

Every response has a unique ID which helps identifying potential problems. It also includes a status code that can help identifying the cause of a potential problem.

Successful requests include a `data` key, which hold a valid response object, and a `meta` key, which holds additional information about the result.

```js
{
  "id": ...,
  "status": ...,
  "data": { ... },
  "meta": { ... },
}
```

In case of failur, the server responds with `errors` key, which holds a list of error objects.

```js
{
  "id": ...,
  "status": ...,
  "errors": [ ... ]
}
```

Query requests through `GET` method can return status codes `200`, `400`, `401`, `403` or `500`. Mutations through `POST`, `PUT` and `DELETE` can return also codes `201` and `422`. Invalid routes return status code `404`.

* **200**: Success.
* **201**: Successfully created.
* **400**: Invalid resource or resource not found.
* **401**: Unauthenticated access.
* **403**: Unauthorized access.
* **404**: Path not found.
* **422**: Data validation failed.
* **500**: System error.

## Error Handling

Errors include a unique code number and an error message. The code number helps identifying potential problems and points to the exact position in the system.

```js
{
  ...
  "errors": [
    {
      "code": 422000,
      "message": "Invalid path."
    }
  ]
}
```

Below is a complete list of handled errors.

### Default errors

| Code | Message
|-|-
| 500034 | Unhandled system error.

### Validation errors

| Code | Message
|-|-
| 422001 | Profile validation failed because `email` is not present.
| 422002 | Profile validation failed because `email` is not a valid email address.'
| 422003 | Profile validation failed because `email` has already been taken.
| 422004 | Profile validation failed because `password` is not present.
| 422005 | Profile validation failed because `password` is not between 8 and 24 characters long.
| 422006 | Profile validation failed because `profileAbilities.kind` is not present.
| 422007 | Profile validation failed because `profileAbilities.kind` is invalid.
| 422008 | Profile validation failed because `firstName` is not present.
| 422009 | Profile validation failed because `email` does not exist.
| 422010 | Profile validation failed because `lastName` is not present.
| 422011 | Profile validation failed because `profilePayments.kind` is invalid.
| 422012 | Profile validation failed because `profilePayments.reference` is not present.
| 422013 | Profile validation failed because `profilePayments.profileId` is not present.
| 422014 | Community validation failed because `name` is not present.
| 422015 | Community validation failed because `description` is not present.
| 422016 | Community validation failed because `communityAbilities.kind` is not present.
| 422017 | Community validation failed because `communityAbilities.kind` is invalid.
| 422019 | Profile validation failed because `communityAbilities.communityId` is not present.
| 422020 | Add collaborator request validation failed because `communityId` is not present.
| 422021 | Community validation failed because `communityAbilities.id` is not present.
| 422022 | Key validation failed because `keyAbilities.kind` is not present.
| 422023 | Key validation failed because `keyAbilities.kind` is invalid.

### Route errors

| Code | Message
|-|-
| 400000 | Invalid path.
| 400001 | Profile can not be identified.
| 400002 | Profile credentials are invalid.
| 400003 | Request token is invalid.
| 400004 | You are not authorized to update your profile.
| 400005 | You are not authorized to delete your profile.
| 400006 | You are not authorized to change your password.
| 400007 | You are not authorized to authenticate.
| 400008 | Profile does not exists.
| 400009 | You are not authorized to change your email.
| 400010 | You are not authorized to create new community.
| 400011 | You are not authorized to delete this community.
| 400012 | You are not authorized to update this community.
| 400013 | Community does not exists.
| 400014 | You are not authorized to create new key.
| 400015 | You are not authorized to delete this key.
| 400016 | You are not authorized to read this key data.
| 400017 | You are not authorized to create new key ability.
| 400018 | You are not authorized to delete key ability.
| 400019 | Key does not exists.
| 400020 | You are not a collaborator of this community.
| 400021 | You are not authorized to add new community ability.
| 400022 | You are not authorized to remove community ability.
| 400023 | You are not authorized to read community abilities


## Authentication

Most of the API routes restrict public access and require authentication. Authenticated requests must include a query-string parameter `authToken={token}` or an HTTP header `Authorization` holding the [JSON Web Token](https://en.wikipedia.org/wiki/JSON_Web_Token). The authentication token can be generated through the `/profile/auth` route.

## Authorization

Some routes require that a user has certain abilities. Abilities unlock profile's access to certain features in the system.

### Profile abilities

Profile abilities regulates authenticated user permissions.

| Code | Description
|-|-
| 1001 | User can authenticate.
| 1002 | User can update profile information.
| 1003 | User can delete profile.
| 1004 | User can reset login password.
| 1005 | User can change login email.
| 1006 | User can create new community.
| 1007 | User can create credentials.
| 1008 | User can delete credentials.
| 1009 | User can complete or fail credentails.
| 1010 | User can read credentials.
| 1011 | User can read all credentials(admin).
| 1012 | User can request credentials.
| 1013 | User can accept or reject credential request.

### Community abilities

Community abilities regulates the abilities of a specific profile on a specific community.

| Code | Description
|-|-
| 2001 | User can read community data.
| 2002 | User can update community data.
| 2003 | User can delete community.
| 2004 | User can create new API key.
| 2005 | User can delete existing API key.
| 2010 | User can add ability to community collaborator.
| 2011 | User can remove ability to community collaborator.
| 2012 | User can read community collaborator's abilities.
| 2013 | User can read API key abilities and data.
| 2014 | User can add ability to existing API key.
| 2015 | User can remove ability from existing API key.
| 2016 | User can create community achievements.
| 2017 | User can delete community achievements.
| 2018 | User can update community achievements.
| 2019 | User can read community achievements.

### Key abilities

Key abilities regulates the abilities of a specific API key ona a specific community.

| Code | Description
|-|-
| 3001 | User can read asset.
| 3002 | User can create new asset.
| 3003 | User can update existing asset.
| 3004 | User can delete existing asset.
| 3005 | User can read article.
| 3006 | User can create new article.
| 3007 | User can update existing article.
| 3008 | User can delete existing article.

## Routes

Most of the routes are `private` which means that user authentication is required. The API request and response are based on user's abilities. `Profile` routes serve personalized content for the currently authenticated user and are regulated by profile abilities. Other routes serve project-associated content and are regulated by project abilities.

### Profile

#### [private] GET /profile

> Returns profile information of the currently authenticated user.

#### [public] POST /profile/auth

> Generates an authentication token for accessing private routes.

##### Body fields

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| email | String | - | 42215 | Unique login email.
| password | String | - | 42210 | Login password.

#### [public] POST /profile/request

> Sends an email with create profile request token.

##### Body fields

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| email | String | - | 422001, 422002, 422003 | Login email address.
| firstName | String | - | 422008 | Profile first name.
| lastName | String | - | 422010 | Profile last name.
| password | String | - | 422004, 422005 | Login password.

#### [public] POST /profile

> Creates a new user profile.

##### Body fields

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| requestToken | String | - | 400003, 422001, 422002, 422003, 422004 | Create profile request token.

#### [private] PUT /profile

> Updates profile information of the currently authenticated user.

##### Body fields

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| firstName | String | - | 422008 | Full user name.
| lastName | String | - | 422010 | Full user name.

#### [private] DELETE /profile

> Deletes profile of the currently authenticated user (is only marked as deleted and is physically removed after 30 days).

#### [public] POST /profile/reset-password/request

> Sends an email with password reset request token to a user. The associated `requestToken` includes profile's email and expires after 1 day.

##### Body fields

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| email | String | - | 422001, 422002, 422009 | Profile's email.

#### [public] PUT /profile/reset-password

> Sets new profile's login password based on email stored in the `requestToken`.

##### Body fields

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| password | String | - | 422004, 422005 | New login password.
| requestToken | String | - | 422004, 400001, 400003, 400006, 400008 | Reset password request token.

#### [private] POST /profile/reset-email/request

> Sends an email with change email request token to currently authenticated user. The associated `requestToken` includes new login email and expires after 1 day.

##### Body fields

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| newEmail | String | - | 422001, 422002, 422003, 422009 | New login email address.

#### [private] POST /profile/reset-email

> Sets new login email for currently authenticated user based on the `requestToken`.

##### Body fields

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| requestToken | String | - | 422001, 422002, 422003 | Change email request token.

#### [private] GET /profile/abilities

> Returns all profile abilities for the currently authenticated user.

#### [private] GET /profile/payment/:id

> Gets payment details for specified payment id of the currently authenticated user.

##### Path parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| id | String | - | - | Payment ID.


#### [private] GET /profile/payments

> Returns all profile payment methods for the currently authenticated user.

#### [private] POST /profile/payments

> Adds a new profile payment kind.

##### Body fields

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| kind | Integer | - | 40003 | Payment kind.

### Communities

#### [private] GET /communities

> Returns a paginated list of communities based on profile abilities.

##### Query parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| skip | Integer | 0 | - | Number of items to be skip.
| limit | Integer | 25 | - | Maximum number of items.
| search | String | - | - | Search keywords.
| filterIds | String[] | - | - | When present only items with specified IDs are returned.
| filterPermissionKinds | Integer[] | - | - | When present only items with specified permission kinds are returned.
| sort | Integer | - | - | Sort strategy.

##### Sort strategies

| Number | Description
|-|-
| 1 | Sort by name in ascending order.
| -1 | Sort by name in descending order.

#### [private] POST /communities

> Creates a community.

##### Body fields

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| name | String | - | 422014 | Community name.
| description | String | - | 422015 | Community description

#### [private] PUT /communities/:communityId

> Updates existing community data.

##### Path parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| communityId | String | - | - | Community ID.

##### Body fields

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| name | String | - | 422014 | Community name.
| description | String | - | 422015 | Community description

#### [private] DELETE /communities/:communityId

> Marks existing community as terminated. The associated data are removed after 30 days.

##### Path parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| communityId | String | - | - | Community ID.

#### [private] POST /communities/:communityId/collaborators/request

> Sends an email with add collaborator request token to a user. The associated `requestToken` includes profile's email and communityId.

##### Path parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| communityId | String | - | - | Community ID.

##### Body fields

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| email | String | - | 422001, 422002 | Collaborator's emai.

#### [private] POST /communities/:communityId/collaborators

> Collaborator accepts request via requestToken token .

##### Path parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| communityId | String | - | - | Community ID.

##### Body fields

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| requestToken | String | - | - | Add collaborator request token.

#### [private] GET /communities/:communityId/collaborators

> Gets all collaborators for specific community.

##### Path parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| communityId | String | - | - | Community ID.

#### [private] GET /communities/:communityId/collaborators/:collaboratorId

> Gets a specific collaborator a for specific community.

##### Path parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| collaboratorId | String | - | - | Collaborator ID.
| communityId | String | - | - | Community ID.

##### Body fields

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| profileId | String | - | 400001 | Profile ID.

#### [private] GET /communities/:communityId/abilities

> Returns all community abilities of a community.

##### Path  parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| communityId| String | - | - | Community ID.

#### [private] POST /communities/:communityId/abilities

> Adds a community ability for a specific profile.

##### Path parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| communityId | String | - | - | Community ID.

##### Body fields

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| profileId | String | - | 40003 | Profile ID.
| kind | Integer | - | 40003 | Community ability Kind.

#### [private] DELETE /communities/:communityId/abilities/:abilityId

> Removes community ability for a specific profile.

##### Path parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| communityId | String | - | - | Community ID.

| abilityId | String | - | - | Ability ID

#### TODO: [private] PUT /communities/:communityId/payment

> Sets payment data for the specific community.

##### Path parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| communityId | String | - | - | Community ID.

##### Body fields

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| kind | Integer | - | 40003 | Payment kind.
| profileId | String | - | 40003 | Community description

#### TODO: [private] DELETE /communities/:communityId/payments/:paymentId

> Removes payment method for the specific community.

##### Path parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| communityId | Integer | - | - | Community ID.
| paymentId | Integer | - | - | Profile payment ID.

#### [private] POST /communities/:communityId/keys

> Creates new API key for the specific community.

##### Path parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| communityId | Integer | - | - | Community ID.

##### Body fields

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| permissions | Integer[] | - | 422019, 422020 | List of API key permissions.
| ttl | Integer | - | - | Timestamp until the key expires (unlimited if not set).

#### [private] DELETE /communities/:communityId/keys/:keyId

> Removes API key from the specific community.

##### Path parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| communityId | Integer | - | - | Community ID.
| keyId | Integer | - | - | API key ID.

#### [private] GET /communities/:communityId/keys/:keyId/abilities

> Returns all key abilities of a specific key on a specific community.

##### Body fields

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| keyId | String | - | - | Key ID.
| communityId | String | - | - | Community ID.

#### [private] PUT /communities/:communityId/keys/:keyId/abilities

> Adds a key ability to a specific key on a specific community.

##### Path parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| keyId | String | - | - | Key ID.
| communityId | String | - | - | Community ID.

##### Body fields

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| kind | Integer | - | 422022, 422023 | Key ability kind.

#### [private] DELETE /communities/:communityId/keys/:keyId/abilities/:abilityId

> Removes key ability for a specific key on a specific community.

##### Path parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| keyId | String | - | - | Key ID.
| communityId | String | - | - | Community ID.
| abilityId | String | - | - | Ability ID.

# DEFINITION

## Profiles

* copy all

### [private] POST /profile/credentials

> Creates a new credential request.

#### Body fields

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| achievementId | String | - | 422022, 422023 | Achievement ID.

### [private] GET /profile/credentials

> Returns a paginated list of credentials for specified profile.

#### Query parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| skip | Integer | 0 | - | Number of items to be skip.
| limit | Integer | 25 | - | Maximum number of items.
| search | String | - | - | Search keywords.
| filterIds | String[] | - | - | When present only items with specified IDs are returned.
| sort | Integer | - | - | Sort strategy.

#### Sort strategies

| Number | Description
|-|-
| 1 | Sort by achievement name in ascending order.
| -1 | Sort by achievement name in descending order.

### [private] POST /profile/credentials/:credentialId/cancel

> Cancels credential request.
 
##### Path parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| credentialId | String | - | - | Credential ID.

## Courses

## Communities
GET /communities
GET /communities/:communityId
POST /communities
PUT /communities/:communityId
DELETE /communities/:communityId

## Achievements

### [private] POST /communities/:communityId/achievements

Creates a new achievement.

#### Path parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| communityId | String | - | - | Community ID.

#### Body fields

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| Name | String | - | 422022, 422023 | Name of achievement.
| Tag | String[] | - | 422022, 422023 | Achievement tags.
| dependentAchievementIds | String[] | - | 422022, 422023 | List of achievement ids that this achievement depends on.

### [private] DELETE /communities/:communityId/achievements/:achievementId

Marks specified achievement as deleted.

#### Path parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| communityId | String | - | - | Community ID.
| achievementId | String | - | - | Achievement ID.

### [private] PUT /communities/:communityId/achievements/:achievementId

Updates specified achievement.

#### Path parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| communityId | String | - | - | Community ID.
| achievementId | String | - | - | Achievement ID.

#### Body fields

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| Name | String | - | 422022, 422023 | Name of achievement.
| Tag | String[] | - | 422022, 422023 | Achievement tags.
| dependentAchievementIds | String[] | - | 422022, 422023 | List of achievement ids that this achievement depends on.

### [private] GET /achievements

> Returns a paginated list of achievements.

##### Query parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| skip | Integer | 0 | - | Number of items to be skip.
| limit | Integer | 25 | - | Maximum number of items.
| search | String | - | - | Search keywords.
| filterIds | String[] | - | - | When present only items with specified IDs are returned.
| filterCommunityIds | String[] | - | - | When present only items with specified community IDs are returned.
| filterTags | String[] | - | - | When present only items with specified tags are returned.
| sort | Integer | - | - | Sort strategy.

##### Sort strategies

| Number | Description
|-|-
| 1 | Sort by name in ascending order.
| -1 | Sort by name in descending order.

## Credentials

### [private] POST /credentials

> Creates a new credential.

#### Body fields

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| achievementId | String | - | 422022, 422023 | Achievement ID.
| profileId | String | - | 422022, 422023 | Profile ID.

### [private] DELETE /credentials/:credentialId

> Marks specified credential as deleted.

#### Path parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| credentialId | String | - | - | Credential ID.

### [private] POST /credentials/:credentialId/complete

> Marks specific credential as completed.

#### Path parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| credentialId | String | - | - | Credential ID.

### [private] POST /credentials/:credentialId/fail

> Marks specific credential as failed.

#### Path parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| credentialId | String | - | - | Credential ID.

### [private] POST /credentials/:credentialId/accept

> Accepts credential request by marking it as as pending.

#### Path parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| credentialId | String | - | - | Credential ID.

### [private] POST /credentials/:credentialId/reject

> Rejects credential request by marking it as as rejected.

#### Path parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| credentialId | String | - | - | Credential ID.

#### Body parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| note | String | - | - | Additional note for reject explanation.

### [private] GET /credentials

> Returns a paginated list of credentials.

#### Query parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| skip | Integer | 0 | - | Number of items to be skip.
| limit | Integer | 25 | - | Maximum number of items.
| search | String | - | - | Search keywords.
| filterProfileIds | String | - | - | Filter by profileIds.
| filterIds | String[] | - | - | When present only items with specified IDs are returned.
| filterCommunityIds | String[] | - | - | When present only items with specified community IDs are returned.
| filterTags | String[] | - | - | When present only items with specified tags are returned.
| filterStages | Integer[] | - | - | When present only items with stages are returned.
| sort | Integer | - | - | Sort strategy.

#### Sort strategies

| Number | Description
|-|-
| 1 | Sort by achievement name in ascending order.
| -1 | Sort by achievement name in descending order.
| 2 | Sort by stage in ascending order.
| -2 | Sort by stage in descending order.

## Users

### [private] GET /users

> Returns a paginated list of users.

#### Query parameters

| Name | Type | Default | Errors | Description
|-|-|-|-|-
| skip | Integer | 0 | - | Number of items to be skip.
| limit | Integer | 25 | - | Maximum number of items.
| search | String | - | - | Search keywords.
| filterIds | String[] | - | - | When present only items with specified IDs are returned.
| filterCommunityIds | String[] | - | - | When present only items with specified community IDs with read permission are returned.
| sort | Integer | - | - | Sort strategy.

#### Sort strategies

| Number | Description
|-|-
| 1 | Sort by last name in ascending order.
| -1 | Sort by last name in descending order.