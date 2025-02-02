I will keep it short:

- `make` will show the make help

- `make start` -> starts all the container in production mode
- `make http_A <subpath>/<script>.http` -> runs script found in `service-a/http/<subpath>/<script>.http`
- `make http_B <subpath>/<script>.http` -> runs script found in `service-b/http/<subpath>/<script>.http`

- !! remember the `subpath` and the `.http`

- If you are using vscode you can also run the http scripts directly from file, but you need the [httpyac extension](https://marketplace.cursorapi.com/items?itemName=anweber.vscode-httpyac) installed

- `make logs_A` to see logs of service A
- `make logs_B` to see logs of service B

- if you prefer there is the swagger exposed at `localhost:3000/api` and `localhost:3001/api` for services A and B respectively but I personally prefer cli. It is also missing some information, like the fact that service B endpoints need Basic auth headers
---

How to start using the services:

- create a couple users in service a with `auth/signup.http` script (`make http_A auth/signup.http `)
- create a couple documents in service a with `documents/create-document.http` (`make http_A auth/signup.http `)
- use scripts in service b

---

There is quite a lot going on but I figured we can discuss it in the third interview. A couple of notes:

- You can start the dev mode if you need with `make dev`. It targets a different stage of the docker file and produces an image tagged with `development` so you should be able to go back and forth between them freely

- I tried out prisma, I usually don't use it. I don't know if I did something in the wrong way

- I also tried out httpYac, I like the idea of having these kind of things on simple text files because they can be versioned together with the code

- I initially thought to implement a refresh token system but it would have been very time-consuming so the auth-session part of service b is not fleshed out

- There are many other things that I would have done differently without a time constraint, some of them are:

  - tests
  - concurrency and transactions
  - get-list needs to be paginated, queued or at least batched because like this it could lock service b
  - others that I don't remember

- I like logging, I usually log a lot

- I don't like comments very much because they can lie. Code can never lie.

- I like having a repository layer even if sometimes it looks redundant. Ask me about it if I forget to tell you about it.
