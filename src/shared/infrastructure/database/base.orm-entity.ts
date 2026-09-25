import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

// Id is generated in the domain (Entity base), so it is a plain PrimaryColumn.
// Column names are explicit snake_case (createdBy -> created_by).
// deletedDate is a DeleteDateColumn: soft-deleted rows are excluded from find* by default.
export abstract class BaseOrmEntity {
  @PrimaryColumn({ name: 'id', type: 'uuid' })
  id: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate: Date;

  @Column({ name: 'created_by', type: 'varchar', nullable: true })
  createdBy: string | null;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamptz' })
  updatedDate: Date;

  @Column({ name: 'updated_by', type: 'varchar', nullable: true })
  updatedBy: string | null;

  @DeleteDateColumn({
    name: 'deleted_date',
    type: 'timestamptz',
    nullable: true,
  })
  deletedDate: Date | null;

  @Column({ name: 'deleted_by', type: 'varchar', nullable: true })
  deletedBy: string | null;
}
