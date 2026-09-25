import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTodos1790000000000 implements MigrationInterface {
  name = 'CreateTodos1790000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "todos" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" character varying,
        "updated_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" character varying,
        "deleted_date" TIMESTAMP WITH TIME ZONE,
        "deleted_by" character varying,
        "title" character varying(255) NOT NULL,
        "description" text,
        CONSTRAINT "PK_todos_id" PRIMARY KEY ("id")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "todos"`);
  }
}
