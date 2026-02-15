import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFoodIsCsvFood20260301000000 implements MigrationInterface {
  name = 'AddFoodIsCsvFood20260301000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'food',
      new TableColumn({
        name: 'isCsvFood',
        type: 'boolean',
        isNullable: false,
        default: false,
      }),
    );

    await queryRunner.query(
      "UPDATE food SET isCsvFood = 1 WHERE sourceId IS NOT NULL AND sourceId <> ''",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('food', 'isCsvFood');
  }
}
