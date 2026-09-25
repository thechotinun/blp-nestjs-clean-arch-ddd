# CLAUDE.md

NestJS 12 + TypeORM 1.x (PostgreSQL), Clean Architecture + DDD. Native ESM (`"type": "module"`, `nodenext`). Tests: vitest. Lint: oxlint. Format: prettier (2 spaces, single quotes).

## Commands

```bash
npm run start:dev          # dev server
npm run build              # nest build -> dist/
npm test                   # unit tests (*.spec.ts)
npm run test:e2e           # e2e (*.e2e-spec.ts) — needs a DB, reads .env.test
npm run lint
npx tsc --noEmit -p tsconfig.json   # type-check incl. specs (vitest does not type-check)

npm run migration:generate -- src/shared/infrastructure/database/migrations/<Name>
npm run migration:run
npm run migration:revert
```

Migration CLI runs against compiled `dist/` (no ts-node). Generated migrations go in `src/.../migrations/` and are compiled by `build`.

## Layout

```
src/
├── main.ts
├── app.module.ts                 # ConfigModule (global) + DatabaseModule + bounded-context modules
├── config/                       # configuration.ts — env -> typed config (single source)
├── shared/                       # shared kernel — no business rules
│   ├── domain/                   # Entity (+ EntityAudit), AggregateRoot, ValueObject, DomainEvent, exceptions/
│   ├── application/              # UseCase<I, O>, Paginated<T>
│   ├── infrastructure/database/  # DatabaseModule, TypeOrmConfigService, BaseOrmEntity, audit mapper, Mapper, data-source (CLI), migrations/
│   └── presentation/http/        # ApiResponseInterceptor, HttpExceptionFilter, response types
└── modules/<context>/            # one folder per bounded context
    ├── domain/
    │   ├── <name>.entity.ts              # aggregate / entity (extends AggregateRoot / Entity)
    │   ├── value-objects/<name>.vo.ts
    │   ├── events/<name>.event.ts
    │   ├── exceptions/<name>.exception.ts   # extends DomainException
    │   └── <name>.repository.ts          # repository port (interface + DI token)
    ├── application/
    │   ├── use-cases/<action>.use-case.ts   # implements UseCase
    │   └── dto/                              # use-case input/output (plain types)
    ├── infrastructure/
    │   ├── persistence/<name>.orm-entity.ts      # TypeORM @Entity, extends BaseOrmEntity
    │   ├── persistence/<name>.mapper.ts          # implements Mapper<Domain, OrmEntity>
    │   └── persistence/<name>.typeorm-repository.ts  # implements the domain port
    ├── presentation/
    │   ├── <name>.controller.ts
    │   └── dto/                              # request DTOs (validation)
    └── <context>.module.ts
```

## Dependency rule

`presentation → application → domain ← infrastructure`

- `domain/` imports **nothing** from `@nestjs/*`, `typeorm`, or other layers. Pure TS only.
- `application/` depends on domain only (ports, entities). No TypeORM. `@Injectable`/`@Inject` allowed for DI.
- `infrastructure/` implements domain ports. Only place TypeORM is used.
- `presentation/` calls use cases; never touches repositories or ORM entities directly.
- Domain entity and ORM entity are separate classes, converted via a `*.mapper.ts`. Never return ORM entities past infrastructure.
- Bind ports in the context module: `{ provide: USER_REPOSITORY, useClass: UserTypeOrmRepository }`.

## Conventions

- **Imports:** relative paths with `.js` extension (`'./user.entity.js'`). No tsconfig `paths` aliases — tsc does not rewrite them in ESM output.
- **No `__dirname` / `require`** — use `import.meta.url` / `import.meta.dirname`.
- **Identity:** IDs are UUIDs generated in the domain (`Entity` base uses `randomUUID()`), so ORM PK is `@PrimaryColumn('uuid')` (from `BaseOrmEntity`), never `@PrimaryGeneratedColumn`.
- **Audit fields:** every ORM entity extends `BaseOrmEntity` → `id`, `is_active`, `created_date/by`, `updated_date/by`, `deleted_date/by` (soft delete via `DeleteDateColumn`). Domain side: `Entity.audit` (`EntityAudit`), passed as 3rd arg on `restore(props, id, audit)`. In `*.mapper.ts` use `toEntityAudit(record)` / `...toAuditColumns(entity.audit)` — never map audit fields by hand. `*By` values are not set automatically yet.
- **Entities registration:** `autoLoadEntities: true` — register ORM entities with `TypeOrmModule.forFeature([...])` in each context module.
- **Relations (ESM):** type relation properties with `Relation<T>` from typeorm to avoid circular-import TDZ errors:
  `@ManyToOne(() => UserOrmEntity) user: Relation<UserOrmEntity>;`
- **Aggregates:** create via static factory (`static create(...)`), rehydrate via `static restore(props, id)`; constructor is `protected`/`private`. Mutate state only through methods that enforce invariants.
- **Value objects:** immutable, validated in factory, compared with `equals()`.
- **Domain events:** raised with `addDomainEvent()` inside the aggregate; collected with `pullDomainEvents()` after persistence. Dispatcher not yet wired.
- **Tests:** vitest globals (`vi.fn`, `describe`, `it`). Unit specs next to source (`*.spec.ts`). Domain tests need no Nest testing module.

## API response & errors

Routes are served under `/api/v1/...` (global prefix `api` + URI versioning, default `1`).
`ApiResponseInterceptor` and `HttpExceptionFilter` are registered globally in `AppModule` (`APP_INTERCEPTOR` / `APP_FILTER`).

- **Controllers return plain data** — never build the envelope by hand.
  - Single object → `{ data, status: { code, message } }`
  - `Paginated<T>` (from `shared/application`) → `{ data, links, meta, status }`. Use `paginated.map(toResource)` to shape items.
  - `status.code` is the real HTTP status (`201` for POST, `@HttpCode` respected). 204 / `StreamableFile` pass through unwrapped.
- **Pagination links:** `first` = `?perPage=N`, `previous`/`next`/`last` = `?page=X&perPage=N`, `""` when absent. Other query params are kept.
- **Errors:** throw a `DomainException` subclass from domain/application — never a Nest `HttpException` there.
  ```ts
  export class ExampleNotFoundException extends DomainException {
    constructor() {
      super(DomainErrorType.NOT_FOUND, 100101, 'EXAMPLE_NOT_FOUND');
    }
  }
  ```
  Body: `{ status: { code, message }, error: { code, message, errors } }`. `DomainErrorType` → HTTP: VALIDATION 400, UNAUTHORIZED 401, FORBIDDEN 403, NOT_FOUND 404, CONFLICT 409, BUSINESS_RULE 422.
- Non-domain errors: `HttpException` → `error.code` = HTTP status, `error.message` = UPPER_SNAKE status text, `errors` = ValidationPipe message array. Unknown errors → 500, logged, no internals in body.

## Pending (to be provided by the owner — do not invent)

- **Base repository** → `shared/infrastructure/database/` (+ repository port in `shared/domain/`)

Until these exist, do not create ad-hoc replacements; ask first.
