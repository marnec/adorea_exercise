RUN_ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))

$(eval $(RUN_ARGS):;@:)

help:
	@fgrep -h "##" $(MAKEFILE_LIST)| fgrep -v fgrep | tr -d '##' | awk 'BEGIN {FS = ":.*?@ "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

DEV_ENV=.env.development
PROD_ENV=.env.production

dev: ## start development env
	docker compose --env-file=${DEV_ENV} up -d

prisma_generate_A: ## generate definition of prisma in service A
	docker compose --env-file=${DEV_ENV} exec service_a npx prisma generate

prisma_generate_B: ## generate definition of prisma in service B
	docker compose --env-file=${DEV_ENV} exec service_b npx prisma generate

migration_add_A: ## create migration files to service-a from diff schema/definition
	docker compose --env-file=${DEV_ENV} exec service_a npx prisma migrate dev --name "$(RUN_ARGS)"

migration_deploy_A: ## deploy defined migrations in service a
	docker compose --env-file=${DEV_ENV} exec service_a npx prisma migrate deploy

migration_add_B: ## create migration files to service-b from diff schema/definition
	docker compose --env-file=${DEV_ENV} exec service_b npx prisma migrate dev --name "$(RUN_ARGS)"

migration_deploy_B: ## deploy defined migrations in service b
	docker compose --env-file=${DEV_ENV} exec service_b npx prisma migrate deploy

stop: ## stop all containers in compose (env independent)
	docker compose down

start: ## start production env
	docker compose --env-file=${PROD_ENV} up -d --build

logs_A: ## show logs of service A (follows)
	docker compose logs -f service_a

logs_B: ## show logs of service B (follows)
	docker compose logs -f service_b

http_A: ## call http script defined in service-a/http 
	FILENAME="/data/http/service-a/$(RUN_ARGS)" docker compose up httpyac

http_B:  ## call http script defined in service-b/http 
	FILENAME="/data/http/service-b/$(RUN_ARGS)" docker compose up httpyac

test_A:
	docker compose --env-file=${DEV_ENV} exec service_a npm run test:e2e