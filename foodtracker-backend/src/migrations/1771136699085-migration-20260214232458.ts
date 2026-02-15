import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration202602142324581771136699085 implements MigrationInterface {
    name = 'Migration202602142324581771136699085'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`friendship\` (\`id\` int NOT NULL AUTO_INCREMENT, \`status\` enum ('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`requesterId\` int NOT NULL, \`addresseeId\` int NOT NULL, UNIQUE INDEX \`IDX_48a37dcc1431c47e2d92b2f404\` (\`requesterId\`, \`addresseeId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`refreshTokenHash\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`refreshTokenExpiresAt\``);
        await queryRunner.query(`ALTER TABLE \`friendship\` ADD CONSTRAINT \`FK_b29f15b88ee36453605ade63cb2\` FOREIGN KEY (\`requesterId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`friendship\` ADD CONSTRAINT \`FK_8012340b570c83b55e0d3ef829a\` FOREIGN KEY (\`addresseeId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`friendship\` DROP FOREIGN KEY \`FK_8012340b570c83b55e0d3ef829a\``);
        await queryRunner.query(`ALTER TABLE \`friendship\` DROP FOREIGN KEY \`FK_b29f15b88ee36453605ade63cb2\``);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`refreshTokenExpiresAt\` timestamp NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`refreshTokenHash\` varchar(64) NULL`);
        await queryRunner.query(`DROP INDEX \`IDX_48a37dcc1431c47e2d92b2f404\` ON \`friendship\``);
        await queryRunner.query(`DROP TABLE \`friendship\``);
    }

}
