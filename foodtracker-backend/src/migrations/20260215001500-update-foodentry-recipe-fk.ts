import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class UpdateFoodEntryRecipeFk20260215001500
  implements MigrationInterface
{
  name = 'UpdateFoodEntryRecipeFk20260215001500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('food_entry');
    if (!table) {
      return;
    }

    const recipeFk = table.foreignKeys.find((fk) =>
      fk.columnNames.includes('recipeId'),
    );
    if (recipeFk) {
      await queryRunner.dropForeignKey('food_entry', recipeFk);
    }

    await queryRunner.createForeignKey(
      'food_entry',
      new TableForeignKey({
        columnNames: ['recipeId'],
        referencedTableName: 'recipe',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('food_entry');
    if (!table) {
      return;
    }

    const recipeFk = table.foreignKeys.find((fk) =>
      fk.columnNames.includes('recipeId'),
    );
    if (recipeFk) {
      await queryRunner.dropForeignKey('food_entry', recipeFk);
    }

    await queryRunner.createForeignKey(
      'food_entry',
      new TableForeignKey({
        columnNames: ['recipeId'],
        referencedTableName: 'recipe',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
      }),
    );
  }
}
