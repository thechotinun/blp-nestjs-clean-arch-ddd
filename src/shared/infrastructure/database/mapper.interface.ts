export interface Mapper<TDomain, TOrmEntity> {
  toDomain(record: TOrmEntity): TDomain;
  toPersistence(entity: TDomain): TOrmEntity;
}
